# Form Filler

This project aims to fill forms while being offline.

## Installing

### On Chrome

Visit `chrome://extensions`, activate the Developer mode (at the top of the page),
click the first button, then select the project folder (that doesn't need to be
packaged for Chrome), and that's it.

*Note:* Do not worry if you have warnings while installing, it's because of
compatibility issues between browsers.

### On Firefox

You need to package the extension first ; to do so, navigate to the project folder
and package it with `zip FormFiller.xpi .`. Then drop the .xpi file into a
Firefox tab, validate the pop-up message, and you're done.

*Note:* If you have errors, visit `about:config` and invert the value of the key
`xpinstall.signatures.required`.

## Authors

* [Rémy Raes](mailto:remy.raes@etudiant.univ-lille1.fr)
* [Jules Spicht](mailto:jules.spicht@€tudiant.univ-lille1.fr)

Under the supervision of [Samuel Hym](mailto:samuel.hym@univ-lille1.fr).
