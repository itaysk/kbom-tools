.PHONY:default
default:
	@echo "Usage: make <filename>.[json|dot|dot.svg|mmd|mmd.svg] IN=<kbom.cdx.json>"

$(IN):
	@test -f $@ || (echo "File not found: $@" && exit 1)

%.json: $(IN) skbom.mjs
	node ./skbom.mjs $(IN) > $@

%.dot: %.json dot.mjs
	node ./dot.mjs $< > $@

%.mmd: %.json mmd.mjs
	node ./mmd.mjs $< > $@

%.dot.svg: %.dot
	dot -Tsvg -Gcenter=true $< > $@

%.mmd.svg: %.mmd
	mmdc -i $< -o $@
