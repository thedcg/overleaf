import {
  repositionTooltips,
  showTooltip,
  Tooltip,
  ViewPlugin,
} from '@codemirror/view'
import {
  Compartment,
  EditorState,
  Extension,
  StateField,
  TransactionSpec,
} from '@codemirror/state'
import { loadMathJax } from '../../mathjax/load-mathjax'
import { descendantsOfNodeWithType } from '../utils/tree-query'
import {
  mathAncestorNode,
  parseMathContainer,
} from '../utils/tree-operations/math'
import { documentCommands } from '../languages/latex/document-commands'
import { debugConsole } from '@/utils/debugging'
import { isSplitTestEnabled } from '@/utils/splitTestUtils'

const REPOSITION_EVENT = 'editor:repositionMathTooltips'

export const mathPreview = (enabled: boolean): Extension => {
  if (!isSplitTestEnabled('math-preview')) {
    return []
  }

  return mathPreviewConf.of(enabled ? mathPreviewStateField : [])
}

const mathPreviewConf = new Compartment()

export const setMathPreview = (enabled: boolean): TransactionSpec => ({
  effects: mathPreviewConf.reconfigure(enabled ? mathPreviewStateField : []),
})

const mathPreviewStateField = StateField.define<readonly Tooltip[]>({
  create: buildTooltips,

  update(tooltips, tr) {
    if (tr.docChanged || tr.selection) {
      tooltips = buildTooltips(tr.state)
    }

    return tooltips
  },

  provide: field => [
    showTooltip.computeN([field], state => state.field(field)),

    ViewPlugin.define(view => {
      const listener = () => repositionTooltips(view)
      window.addEventListener(REPOSITION_EVENT, listener)
      return {
        destroy() {
          window.removeEventListener(REPOSITION_EVENT, listener)
        },
      }
    }),
  ],
})

const renderMath = async (
  content: string,
  displayMode: boolean,
  element: HTMLElement,
  definitions: string
) => {
  const MathJax = await loadMathJax()

  MathJax.texReset([0]) // equation numbering is disabled, but this is still needed

  try {
    await MathJax.tex2svgPromise(definitions)
  } catch {
    // ignore errors thrown during parsing command definitions
  }

  const math = await MathJax.tex2svgPromise(content, {
    ...MathJax.getMetricsFor(element),
    display: displayMode,
  })
  element.textContent = ''
  element.append(math)
}

function buildTooltips(state: EditorState): readonly Tooltip[] {
  const tooltips: Tooltip[] = []

  for (const range of state.selection.ranges) {
    if (range.empty) {
      const pos = range.from
      const content = buildTooltipContent(state, pos)
      if (content) {
        const tooltip: Tooltip = {
          pos,
          above: true,
          arrow: false,
          create() {
            const dom = document.createElement('div')
            dom.append(content)
            dom.className = 'ol-cm-math-tooltip'

            return { dom, overlap: true, offset: { x: 0, y: 8 } }
          },
        }

        tooltips.push(tooltip)
      }
    }
  }

  return tooltips
}

const buildTooltipContent = (
  state: EditorState,
  pos: number
): HTMLDivElement | null => {
  // if anywhere inside Math, render the whole Math content
  const ancestorNode = mathAncestorNode(state, pos)
  if (!ancestorNode) return null

  const [node] = descendantsOfNodeWithType(ancestorNode, 'Math', 'Math')
  if (!node) return null

  const math = parseMathContainer(state, node, ancestorNode)
  if (!math || !math.content.length) return null

  const element = document.createElement('div')
  element.style.opacity = '0'
  element.style.transition = 'opacity .01s ease-in'
  element.textContent = math.content

  let definitions = ''
  const commandState = state.field(documentCommands, false)

  if (commandState?.items) {
    for (const command of commandState.items) {
      if (command.type === 'definition' && command.raw) {
        definitions += `${command.raw}\n`
      }
    }
  }

  renderMath(math.content, math.displayMode, element, definitions)
    .then(() => {
      element.style.opacity = '1'
      window.dispatchEvent(new Event(REPOSITION_EVENT))
    })
    .catch(error => {
      debugConsole.error(error)
    })

  return element
}
