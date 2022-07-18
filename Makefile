DOT_FILES=$(wildcard docs/public/*.dot)
DOTSVG=$(DOT_FILES:.dot=.svg)

%.svg: %.dot
	dot -Tsvg -Nfontname=sans-serif -Nfontsize=12 $< > $@

.PHONY: diagrams
diagrams: $(DOTSVG)

clean:
	rm docs/public/workflow*.svg