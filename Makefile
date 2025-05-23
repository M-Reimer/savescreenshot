# -*- Mode: Makefile -*-
#
# Makefile for Undo Close Tab
#

FILES = manifest.json \
        background.js \
        contentscript.js \
        default-preferences.json \
        _globals.js \
        options.html \
        options.js \
        options.css \
        dataurlparser.js \
        imagecomments.js \
        utils/iconupdater.js \
        utils/storage.js \
        utils/html-i18n.js \
        utils/options.css \
        lib/crc32.js \
        icons/savescreenshot.svg \
        icons/info.svg \
        customstyles/rules.js \
        $(wildcard customstyles/*.css) \
        $(wildcard popup/choose_format.*) \
        $(wildcard _locales/*/messages.json)

ADDON = savescreenshot

VERSION = $(shell sed -n  's/^  "version": "\([^"]\+\).*/\1/p' manifest.json)

ANDROIDDEVICE = $(shell adb devices | cut -s -d$$'\t' -f1 | head -n1)

WEBEXT_UTILS_REPO = git@github.com:M-Reimer/webext-utils.git

trunk: $(ADDON)-trunk.xpi

release: $(ADDON)-$(VERSION).xpi

%.xpi: $(FILES) icons/$(ADDON)-light.svg
	@zip -9 - $^ > $@

icons/$(ADDON)-light.svg: icons/$(ADDON).svg
	@sed 's/:#0c0c0d/:#f9f9fa/g' $^ > $@

clean:
	rm -f $(ADDON)-*.xpi
	rm -f icons/$(ADDON)-light.svg

# Starts local debug session
run: icons/$(ADDON)-light.svg
	web-ext run --pref=devtools.browserconsole.contentMessages=true --bc

# Starts debug session on connected Android device
arun: icons/$(ADDON)-light.svg
	@if [ -z "$(ANDROIDDEVICE)" ]; then \
	  echo "No android devices found!"; \
	else \
	  web-ext run --target=firefox-android --firefox-apk=org.mozilla.fenix --android-device="$(ANDROIDDEVICE)"; \
	fi

# Subtree stuff for webext-utils
# Note to myself. Initial setup of subtree:
# git subtree add --prefix utils git@github.com:M-Reimer/webext-utils.git master

subtree-pull:
	git subtree pull --prefix utils "$(WEBEXT_UTILS_REPO)" master

subtree-push:
	git subtree push --prefix utils "$(WEBEXT_UTILS_REPO)" master
