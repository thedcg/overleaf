define () ->
	environments = [
		"abstract",
		"align", "align*",
		"equation", "equation*",
		"gather", "gather*",
		"multline", "multline*",
		"split",
		"verbatim"
	]

	staticSnippets = for env in environments
		{
			caption: "\\begin{#{env}}..."
			snippet: """
				\\begin{#{env}}
				\t$1
				\\end{#{env}}
			"""
			meta: "env"
		}

	staticSnippets = staticSnippets.concat [{
		caption: "\\begin{array}..."
		snippet: """
			\\begin{array}{${1:cc}}
			\t$2 & $3 \\\\\\\\
			\t$4 & $5
			\\end{array}
		"""
		meta: "env"
	}, {
		caption: "\\begin{figure}..."
		snippet: """
			\\begin{figure}
			\t\\centering
			\t\\includegraphics{$1}
			\t\\caption{${2:Caption}}
			\t\\label{${3:fig:my_label}}
			\\end{figure}
		"""
		meta: "env"
	}, {
		caption: "\\begin{tabular}..."
		snippet: """
			\\begin{tabular}{${1:c|c}}
			\t$2 & $3 \\\\\\\\
			\t$4 & $5
			\\end{tabular}
		"""
		meta: "env"
	}, {
		caption: "\\begin{table}..."
		snippet: """
			\\begin{table}[$1]
			\t\\centering
			\t\\begin{tabular}{${2:c|c}}
			\t\t$3 & $4 \\\\\\\\
			\t\t$5 & $6
			\t\\end{tabular}
			\t\\caption{${7:Caption}}
			\t\\label{${8:tab:my_label}}
			\\end{table}
		"""
		meta: "env"
	}, {
		caption: "\\begin{list}..."
		snippet: """
			\\begin{list}
			\t\\item $1
			\\end{list}
		"""
		meta: "env"
	}, {
		caption: "\\begin{enumerate}..."
		snippet: """
			\\begin{enumerate}
			\t\\item $1
			\\end{enumerate}
		"""
		meta: "env"
	}, {
		caption: "\\begin{itemize}..."
		snippet: """
			\\begin{itemize}
			\t\\item $1
			\\end{itemize}
		"""
		meta: "env"
	}, {
		caption: "\\begin{frame}..."
		snippet: """
			\\begin{frame}{${1:Frame Title}}
			\t$2
			\\end{frame}
		"""
		meta: "env"
	}]

	CUSTOM_ENVIRONMENT_REGEX = /^\\newenvironment{(\w+)}.*$/gm

	parseCustomEnvironmentNames = (text) ->
		names = []
		iterations = 0
		while match = CUSTOM_ENVIRONMENT_REGEX.exec(text)
			names.push match[1]
			iterations += 1
			if iterations >= 1000
				return names
		return names

	BEGIN_COMMAND_REGEX = /^\\begin{(\w+)}.*$/gm

	parseBeginCommandNames = (text) ->
		names = []
		iterations = 0
		while match = BEGIN_COMMAND_REGEX.exec(text)
			names.push match[1]
			iterations += 1
			if iterations >= 1000
				return names
		return names

	class SnippetManager
		getCompletions: (editor, session, pos, prefix, callback) ->
			# console.log ">> get snippet completions", editor, session, pos, prefix
			docText = session.getValue()
			customEnvironmentNames = parseCustomEnvironmentNames(docText)
			beginCommandNames = parseBeginCommandNames(docText)
			# console.log customEnvironmentNames
			parsedNames = _.union(customEnvironmentNames, beginCommandNames)
			snippets = staticSnippets.concat(
				parsedNames.map (name) ->
					{
						caption: "\\begin{#{name}}..."
						snippet: """
							\\begin{#{name}}
							$1
							\\end{#{name}}
						"""
						meta: "env"
					}
			).concat(
				# arguably these `end` commands shouldn't be here, as they're not snippets
				# but this is where we have access to the `begin` environment names
				# *shrug*
				parsedNames.map (name) ->
					{
						caption: "\\end{#{name}}"
						value: "\\end{#{name}}"
						meta: "env"
					}
			)
			callback null, snippets

	return SnippetManager
