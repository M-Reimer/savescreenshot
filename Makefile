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
        icons/savescreenshot.svg \
        $(wildcard popup/choose_format.*) \
        $(wildcard _locales/*/messages.json)

savescreenshot-trunk.xpi: $(FILES) icons/savescreenshot-light.svg
	@zip -9 - $^ > $@

icons/savescreenshot-light.svg: icons/savescreenshot.svg
	@sed -e 's/:#4c4c4c/:#ffffff/g' $^ > $@

clean:
	rm -f savescreenshot-trunk.xpi
	rm -f icons/savescreenshot-light.svg
