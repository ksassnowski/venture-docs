DOT_FILES=$(wildcard docs/.vuepress/public/*.dot)
DOTSVG=$(DOT_FILES:.dot=.svg)

%.svg: %.dot
	dot -Tsvg -Nfontname=sans-serif -Nfontsize=12 $< > $@

.PHONY: diagrams
diagrams: $(DOTSVG)

clean:
	rm docs/.vuepress/public/workflow*.svg
	rm -rf docs/.vuepress/dist/