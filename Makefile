# -*- Mode: Makefile -*-
#
# Makefile for Undo Close Tab
#

.PHONY: xpi

xpi: clean
	zip -r9 savescreenshot-trunk.xpi manifest.json \
                                 popup \
                                 _locales \
                                 background.js \
                                 contentscript.js \
                                 _sendmessage.js \
                                 savescreenshot.svg
clean:
	rm -f savescreenshot-trunk.xpi
