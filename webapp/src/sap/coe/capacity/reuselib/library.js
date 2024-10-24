/*!
 * ${copyright}
 */

/**
 * Initialization Code and shared classes of library sap.coe.capacity.reuselib.
 */
sap.ui.define(["jquery.sap.global",
		"sap/ui/core/library"
	], // library dependency
	function(jQuery) {

		"use strict";

		/**
		 * Reuse Library for CoE RPA
		 *
		 * @namespace
		 * @name sap.coe.capacity.reuselib
		 * @author SAP SE
		 * @version ${version}
		 * @public
		 */

		// delegate further initialization of this library to the Core
		sap.ui.getCore().initLibrary({
			name: "sap.coe.capacity.reuselib",
			version: "${version}",
			dependencies: ["sap.ui.core", "sap.m"],
			noLibraryCSS: true,
			types: [],
			interfaces: [],
			controls: [
				"sap.coe.capacity.reuselib.controls.Example"
			],
			elements: []
		});

		return sap.coe.capacity.reuselib;

	}, /* bExport= */ false);