/**
 * @class
 * @name BaseFragmentComponent
 */

sap.ui.define([
    "sap/ui/core/Control",
    "sap/coe/capacity/reuselib/utils/TokenHelper",
    "sap/ui/core/Fragment",
    "sap/m/Token"
], function (Control, TokenHelper, Fragment, Token) {
    "use strict";

    var oBaseFragment = Control.extend("sap.coe.capacity.reuselib.controls.BaseControl.BaseFragmentComponent", {
        /**
         * @property {Object} metadata - metadata of composite control
         * @property {Object} metadata.properties - properties
         * @property {Object} metadata.properties.modelName - parameter for control defining binding context
         * - default "undefined" (oDataModel)
         * @property {Object} metadata.properties.bindingContextRequired - parameter for control to determine if parents binding context is required
         * - default "false"
         * @memberOf BaseFragmentComponent#
         */
        metadata: {
            properties: {
                modelName: {
                    type: "string",
                    defaultValue: undefined
                        //this means the odata model is going to be used
                },
                bindingContextRequired: {
                    type: "boolean",
                    defaultValue: false
                }
            }
        },
        /**
         * @property {Object} renderer - renderer of composite control
         * @property {Function} renderer.render - render function that renders the fragment
         * @memberOf BaseFragmentComponent#
         */
        renderer: {
            render: function (oRm, oControl) {
                oRm.renderControl(oControl.getFragment());
                oControl.fireEvent("compositeControlRendered");
            }
        }
    });
    /**
     * This function sets the model for the component
     * @name _setModel
     * @function
     * @memberOf BaseFragmentComponent~
     * @return {void}
     */
    oBaseFragment.prototype._setModel = function () {
        var sModelName = this.getModelName();
        this.setModel(this.getModel(sModelName));
        this._bIsModelSet = true;
    };
    /**
     * This function clarifies if the model is set
     * @name _isModelSet
     * @function
     * @memberOf BaseFragmentComponent~
     * @return {String} - returns the ID of the created fragment
     */
    oBaseFragment.prototype._isModelSet = function () {
        return this._bIsModelSet;
    };
    /**
     * This function is used for components whose contexts needs to be set according to the parend
     * (This is e.g. relevant for an object header)
     * @name _bindElement
     * @function
     * @memberOf BaseFragmentComponent~
     * @return {void}
     */
    oBaseFragment.prototype._bindElement = function () {
        if (this._oParentView) {
            var oElementBinding = this._oParentView.getElementBinding(this.getModelName());
            /* eslint-disable sap-no-ui5base-prop */
            this.bindElement(oElementBinding.getPath(), oElementBinding.mParameters);
            /* eslint-enable sap-no-ui5base-prop */
        }
    };
    /**
     * This function initializes the fragment
     * @name _initFragment
     * @function
     * @memberOf BaseFragmentComponent~
     * @param {String} sFragmentId - fragment ID
     * @param {String} sFragmentName - fragment name
     * @param {String} sControllerName - [optional] controller for the fragment
     * @return {void}
     */
    oBaseFragment.prototype._initFragment = function (sFragmentId, sFragmentName, sControllerName) {
        // To control the tokenChange event when the tokens are being added from a dialog
        this.bInsertTokensFromDialog = false;
        //Instantiate fragment
        this._sFragmentId = this.getId() + "--" + sFragmentId;
        if (sControllerName) {
            this._oFragmentController = sap.ui.controller(sControllerName);
            this._oFragmentController.setControl(this);
        }
        this._oFragment = sap.ui.xmlfragment(
            this._sFragmentId,
            sFragmentName, (this._oFragmentController) ? this._oFragmentController : this);
        this.addDependent(this._oFragment);

        //TODO: remove workaround on proper library integration
        this.setModel(
            new sap.ui.model.resource.ResourceModel({
                bundleUrl: jQuery.sap.getModulePath("sap.coe.capacity.reuselib") + "/i18n.properties"
            }),
            "i18n");
        //Attach logic for after rendering of UI Control
        this.attachEvent("compositeControlRendered", jQuery.proxy(this._genericAfterRendering, this));
    };
    /**
     * This function sets the model and attaches the _bindElement function to parent object when this fires "bindingChanged" event
     * @name _genericAfterRendering
     * @function
     * @memberOf BaseFragmentComponent~
     * @return {void}
     */
    oBaseFragment.prototype._genericAfterRendering = function () {
        this._setModel();

        if (this.getBindingContextRequired()) {
            var sModelName = this.getModelName();
            this._oParentView = this;
            try {
                do {
                    // Determine parent view
                    this._oParentView = this._oParentView.getParent();
                } while (!this._oParentView.getElementBinding(sModelName));
                this._oParentView.attachEvent("bindingChanged", jQuery.proxy(this._bindElement, this));
                this._bindElement();
            } catch (oError) {
                // Log the error (i.e the parent view is not bound to anything)
                jQuery.sap.log.error(oError);
            }
        }
    };
    /**
     * This function returns the fragment
     * @name getFragment
     * @function
     * @memberOf BaseFragmentComponent#
     * @return {Object} fragment
     */
    oBaseFragment.prototype.getFragment = function () {
        return this._oFragment;
    };
    /**
     * This function returns the ID of the fragment
     * @name getFragmentId
     * @function
     * @memberOf BaseFragmentComponent#
     * @return {String} ID of the fragment
     */
    oBaseFragment.prototype.getFragmentId = function () {
        return this._sFragmentId;
    };
    /**
     * This function returns the controller for the fragment
     * @name getController
     * @function
     * @memberOf BaseFragmentComponent#
     * @return {Object} controller for the fragment
     */
    oBaseFragment.prototype.getController = function () {
        return this._oFragmentController;
    };
    /**
     * Basic MultiInput Validator
     * @name addValidator
     * @function
     * @memberOf BaseFragmentComponent#
     * @param {Object} oMultiInput: input containing the tokens
     * @param {String} sPath:
     * @return {void}
     */
    oBaseFragment.prototype.addValidator = function (oMultiInput, sPath) {
        oMultiInput.addValidator(function (args) {
            var sText = args.text;
            return new sap.m.Token({
                key: sText,
                text: sText
            });
        });
    };
    /**
     * Genaric Apply Tokens
     * @name onApplyTokens
     * @function
     * @memberOf BaseFragmentComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    oBaseFragment.prototype.onApplyTokens = function (oEvent) {
        var oVariantFilterModel = this.getModel("VariantFilterModel");
        this.bInsertTokensFromDialog = true;
        TokenHelper.onApplyTokens(oEvent, oVariantFilterModel);
        this.bInsertTokensFromDialog = false;
        this.onCloseDialog(oEvent);
    };
    /**
     * Called by onTokenChange event of sap.m.MultiInput controls. Refers events to add and remove tokens to the relevent
     * functions of the TokenHelper util.
     * @name onTokenChange
     * @function
     * @memberOf BaseFragmentComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    oBaseFragment.prototype.onTokenChange = function (oEvent) {
        oEvent.preventDefault();
        var oVariantFilterModel = this.getModel("VariantFilterModel"),
            sType = oEvent.getParameter("type"),
            sPath = TokenHelper.getFilterTypeToken(oEvent.getSource()),
            sKey,
            oModelProperty = oVariantFilterModel.getProperty("/" + sPath),
            // Check if token change is for qualification select in capacity analysis, as different variant/model structure in use there
            bIsCapAnalQual = this.getQualForCapacity && this.getQualForCapacity() ? true : false,
            bTokenExists;

        // Do not do anything for "tokenChanged" event only for "added" or "removed"
        // Dialogs take care of there own tokens process token events
        if (sType === "tokensChanged" || this.bInsertTokensFromDialog) {
            return;
        }

        if (sType === "removed" || sType === "removedAll") {
            sKey = oEvent.getParameters("removedTokens").removedTokens[0].getProperty("key");
            bTokenExists = oModelProperty ? this._getTokenExists(oModelProperty, sKey) : false;
            if (bTokenExists) {
                TokenHelper.removeToken(oVariantFilterModel.getProperty("/"), sKey, sPath, true, bIsCapAnalQual);
            }
        } else if (sType === "added") {
            sKey = oEvent.getParameters("addedTokens").addedTokens[0].getProperty("key");
            bTokenExists = oModelProperty ? this._getTokenExists(oModelProperty, sKey) : true;
            if (!bTokenExists) {
                TokenHelper._addToken(oVariantFilterModel.getProperty("/"), sKey, sKey, sPath, true, bIsCapAnalQual);
            }
        }
    };
    /**
     * Checks if tokens already exists in data array
     * @name _getTokenExists
     * @function
     * @memberOf BaseFragmentComponent#
     * @param {Object[]} aData - array of token items
     * @param {String} sKey: key of the token
     * @return {void}
     */
    oBaseFragment.prototype._getTokenExists = function (aData, sKey) {
    	var aTokens = aData.hasOwnProperty("tokens") ? aData.tokens : aData;
        var aExistingTokens = aTokens.filter(function (oItem) {
            return oItem.id === sKey;
        });
        return aExistingTokens.length > 0;
    };

    return oBaseFragment;
});