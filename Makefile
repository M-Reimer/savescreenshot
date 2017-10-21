# -*- Mode: Makefile -*-
#
# Makefile for Undo Close Tab
#

FILES = manifest.json \
        background.js \
        contentscript.js \
        _globals.js \
        options.html \
        options.js \
	savescreenshot.svg \
        $(wildcard popup/choose_format.*) \
        $(wildcard _locales/*/messages.json)

savescreenshot-trunk.xpi: $(FILES) savescreenshot-light.svg
	@zip -9 - $^ > $@

savescreenshot-light.svg: savescreenshot.svg
	@sed -e 's/:#4c4c4c/:#ffffff/g' $^ > $@

clean:
	rm -f savescreenshot-trunk.xpi
	rm -f savescreenshot-light.svg
