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

savescreenshot-trunk.xpi: $(FILES)
	@zip -9 - $^ > $@

clean:
	rm -f savescreenshot-trunk.xpi
