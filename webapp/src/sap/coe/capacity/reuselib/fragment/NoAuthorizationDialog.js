sap.ui.define([
    "sap/ui/base/Object"
], function (Object) {
    "use strict";
    return Object.extend("sap.coe.capacity.reuselib.fragment.NoAuthorizationDialog", {
        /**
         * Initializes dialog fragment
         * @name _getDialog
         * @function
         * @param {Object} oView: view which called the event
         * @return {void}
         */
        _getDialog: function () {
            if (!this._oDialog) {
                this._oDialog = sap.ui.xmlfragment("sap.coe.capacity.reuselib.fragment.NoAuthorizationDialog", this);
            }
            return this._oDialog;
        },
        /**
         * Sets dialog as dependant and opens it
         * @name open
         * @function
         * @param {Object} oView: view which called the event
         * @return {void}
         */
        open: function (oView) {
            var oDialog = this._getDialog();
            oView.addDependent(oDialog);
            oDialog.open();
        },
        /**
         * Closes the dialog
         * @name onCloseDialog
         * @function
         * @return {void}
         */
        onCloseDialog: function () {
            this._getDialog().close();
        }
    });
});