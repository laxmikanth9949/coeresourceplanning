sap.ui.define([
    "sap/ui/base/Object",
    "sap/coe/capacity/reuselib/utils/helpers"
], function(ObjectClass, helpers) {
    "use strict";

    return ObjectClass.extend("sap.coe.capacity.reuselib.utils.variantManager", {

        /**
         * Add variant support to an specific filter bar.
         *
         * @public
         *
         * @param {object} oFilterBar The filter bar to suscribe
         * @param {string} sAppId Application id for the variant managerment
         * @param {string} sVariantSet The variant set id associated to that filter bar
         * @param {mixed} vDefaultVariantContent The default variant to apply when no variant is retrieved.
         *                Could be either the content of the "VariantFilterModel" of the filter bar or a function to get the default variant for asynchronous scenarios.
         *                In case of being a function, this must call to "createDefaultVariant" in its logic with the content of the "VariantFilterModel"
         * @param {boolean} bPreventSearchAfterLoad The filterbar will be updated with the default variant and it will trigger the search automatically when this value is not true.
         *
         * @return {object} The instance of the variant manager for that specific configuration
         */
        constructor: function(oFilterBar, sAppId, sVariantSet, vDefaultVariantContent, bPreventSearchAfterLoad) {
            this.sAppId = sAppId;
            this.sVariantSet = sVariantSet;
            this.vDefaultVariantContent = vDefaultVariantContent;
            this.oFilterBar = oFilterBar;
            this.bPreventSearchAfterLoad = bPreventSearchAfterLoad;

            this.oNativeVariantManager = oFilterBar._oVariantManagement;
            if (this.oNativeVariantManager._delayedControlCreation) this.oNativeVariantManager._delayedControlCreation(); //Needed from v1.44. Remove "if" after migration to 1.44 of Support Portal

            this.oVariantPopOver = this.oNativeVariantManager.oVariantPopOver;
            this.oManagementSave = this.oNativeVariantManager.oManagementSave;
            this.oVariantList = this.oNativeVariantManager.oVariantList;
            this.oManagementTable = this.oNativeVariantManager.oManagementTable;
            this.oSaveSave = this.oNativeVariantManager.oSaveSave;
            this.oVariantManage = this.oNativeVariantManager.oVariantManage;
            this.oVariantSave = this.oNativeVariantManager.oVariantSave;

            this.oVariantPopOver.attachBeforeOpen(this.onBeforeOpen.bind(this));
            this.oVariantList.attachSelectionChange(this.onSelectionChange.bind(this));
            this.oVariantManage.attachPress(this.onManageVariants.bind(this));
            this.oManagementSave.attachPress(this.onVariantsEdit.bind(this));
            this.oSaveSave.attachPress(this.onVariantSaveAs.bind(this));
            this.oVariantSave.attachPress(this.onVariantSave.bind(this));

            // In the 'planning calendar' app we need to access the 'Save As' dialog
            // to add a checkbox to allow users to save the date as part of the variant
            if (this.sAppId === "SAP.COE.PLANNING.CALENDARPilot04") {
                this.oSaveAllButton = this.oNativeVariantManager.oVariantSaveAs;
                this.oSaveAllButton.attachPress(this.onSaveAs.bind(this));
            }

            /* eslint-disable sap-no-ui5base-prop */
            /* eslint-disable sap-no-event-prop */
            oFilterBar._oFiltersButton.attachPress(this.onBeforeFiltersOpen.bind(this));
            oFilterBar._oFiltersButton.mEventRegistry.press.reverse(); //ensure that onBeforeFiltersOpen is executed before the native one 
            oFilterBar._oFiltersButton.attachPress(this.onAfterFiltersOpen.bind(this));

            this._init();
            this._getVariants();
        },

        /**
         * Adds a checkbox that allows users to select whether they want to save the date as part of the variants (planning calendar)
         *
         * @public
         *
         * @param {object} oEvent The event
         *
         * @return {void}
         */
        onSaveAs: function (oEvent) {
            this.oNativeVariantManager.oSaveDialogOptionsGrid.addContent(new sap.m.CheckBox({text: "Save Date in Variant", select: this.onSaveDateChecked.bind(this)}));

            this.bSaveVariants = false;
        },

        /**
         * Function to keep track of whether the user has selected to save the date as part of the variants (planning calendar)
         *
         * @public
         *
         * @param {object} oEvent The event
         *
         * @return {void}
         */
        onSaveDateChecked: function(oEvent) {
            this.bSaveVariants = oEvent.getSource().getSelected();
        },

        /**
         * Function to update and activate the default variant
         *
         * @public
         *
         * @param {object} oDefaultVariantContent The content of the "VariantFilterModel" of the filter bar
         *
         * @return {object} oRequestSent The request sent for creation, with the property "results" added.
         */
        createDefaultVariant: function(oDefaultVariantContent) {
            var oDefaultVariant = {
                    ApplicationId: this.sAppId,
                    VariantSetName: this.sVariantSet,
                    VariantDisplayName: "Default",
                    VariantContent: JSON.stringify(oDefaultVariantContent),
                    IsDefault: true,
                    Editable: false,
                    ExecuteOnSelect: false
                },
                oRequestSent = this._updateVariants([oDefaultVariant]);

            oRequestSent.VariantDetails.results = [oDefaultVariant];

            return oRequestSent;
        },

        /**
         * Triggered before the "Filters" dialog is open
         *
         * @public
         *
         * @param {object} oEvent The event
         *
         * @return {void}
         */
        onBeforeFiltersOpen: function(oEvent) {
            this.oVariantList.destroyItems();
        },

        /**
         * Triggered after the "Filters" dialog is open
         *
         * @public
         *
         * @param {object} oEvent The event
         *
         * @return {void}
         */
        onAfterFiltersOpen: function(oEvent) {
            var oSaveButton = this.oFilterBar._oFilterDialog.getButtons()[1],
                oRestoreButton = this.oFilterBar._oFilterDialog.getButtons()[3];

            this._refreshVariants();

            this.oFilterBar._oFilterDialog.attachBeforeClose(this.onBeforeFiltersClose.bind(this));
            this.oFilterBar._oFilterDialog.mEventRegistry.beforeClose.reverse(); //ensure that onBeforeFiltersClose is executed before the native one 
            this.oFilterBar._oFilterDialog.attachAfterClose(this.onAfterFiltersClose.bind(this));

            oSaveButton.setVisible(false);
            oRestoreButton.setVisible(false);
        },

        /**
         * Triggered before the "Filters" dialog is close
         *
         * @public
         *
         * @param {object} oEvent The event
         *
         * @return {void}
         */
        onBeforeFiltersClose: function(oEvent) {
            this.oVariantList.destroyItems();
        },

        /**
         * Triggered after the "Filters" dialog is close
         *
         * @public
         *
         * @param {object} oEvent The event
         *
         * @return {void}
         */
        onAfterFiltersClose: function(oEvent) {
            this._refreshVariants();
        },

        /**
         * Triggered before the "Variants" popup is open
         *
         * @public
         *
         * @param {object} oEvent The event
         *
         * @return {void}
         */
        onBeforeOpen: function(oEvent) {
            this.oVariantSave.setEnabled(true);
            this._refreshVariants();
        },

        /**
         * Triggered when the user select a different variant in list of variants of the "Variants" popup
         *
         * @public
         *
         * @param {object} oEvent The event
         *
         * @return {void}
         */
        onSelectionChange: function(oEvent) {
            var sSelectedKey = oEvent.getParameter("selectedItem").getKey(),
                oSelectedVariant = this._getVariantByKey(sSelectedKey),
                oFilterBar = this.oFilterBar,
                oVariantModel = oFilterBar.getModel("VariantItems");

            oVariantModel.setProperty("/Active", oSelectedVariant);

            this._updateFilterBarFields();
            oFilterBar.search();
        },

        /**
         * Triggered after pressing the button "Manage" of the "Variants" popup. It makes sure that the information displayed in "Manage Variants" popup is correct
         *
         * @public
         *
         * @param {object} oEvent The event
         *
         * @return {void}
         */
        onManageVariants: function(oEvent) {
            var aTableItems = this.oManagementTable.getItems(),
                oStandardVariant = aTableItems[0],
                oDefaultVariant = this._getDefaultVariant(),
                iTableCells = aTableItems[0].getCells().length,
                iRadioButtonCell;

            this.oManagementTable.removeItem(oStandardVariant);
            oStandardVariant.destroy();

            aTableItems = this.oManagementTable.getItems();

            // workaround to find the table cell with the 'default' radiobutton
            for (var j = iTableCells - 1; j >= 0; j--) {
                if (aTableItems[0].getCells()[j].getMetadata().getName() === "sap.m.RadioButton") {
                    iRadioButtonCell = j;
                    break;
                }
            }

            for (var i = aTableItems.length - 1; i >= 0; i--) {
                if (aTableItems[i].getKey() === oDefaultVariant.VariantId) {
                    aTableItems[i].getCells()[iRadioButtonCell].setSelected(true);
                    break;
                }
            }
        },

        /**
         * Triggered after pressing the button "Ok" of the "Manage Variants" popup. Update the variant information when the user has made any change.
         *
         * @public
         *
         * @param {object} oEvent The event
         *
         * @return {void}
         */
        onVariantsEdit: function(oEvent) {
            var aTableItems = this.oManagementTable.getItems(),
                oVariantModel = this.oFilterBar.getModel("VariantItems"),
                oNewVariantsModelData = oVariantModel.getProperty("/"),
                aVariantsInModel = oNewVariantsModelData.Items,
                bVariantsEdited = false,
                aVariantsAfterEdit = [],
                oVariantInModel, sName, bDefault, sKey,
                iTableCells = aTableItems[0].getCells().length,
                iRadioButtonCell;

            // workaround to find the table cell with the 'default' radiobutton
            for (var j = iTableCells - 1; j >= 0; j--) {
                if (aTableItems[0].getCells()[j].getMetadata().getName() === "sap.m.RadioButton") {
                    iRadioButtonCell = j;
                    break;
                }
            }

            for (var i = aTableItems.length - 1; i >= 0; i--) {
                sKey = aTableItems[i].getKey();
                sName = aTableItems[i].getCells()[0].getValue ? aTableItems[i].getCells()[0].getValue().trim() : aTableItems[i].getCells()[0].getText().trim();
                if (sName === "") {
                    sName = this._getVariantByKey(sKey).VariantDisplayName; //Fix weird behaviour when deleting a variant
                }
                bDefault = aTableItems[i].getCells()[iRadioButtonCell].getSelected();
                oVariantInModel = this._getVariantByKey(sKey);

                aVariantsAfterEdit.push(oVariantInModel);
                if (oVariantInModel.VariantDisplayName !== sName) {
                    oVariantInModel.VariantDisplayName = sName;
                    bVariantsEdited = true;
                }

                if (oVariantInModel.IsDefault !== bDefault) {
                    oVariantInModel.IsDefault = bDefault;
                    bVariantsEdited = true;
                }
            }

            if (aVariantsAfterEdit.length !== aVariantsInModel.length) {
                if (this.oNativeVariantManager.aRemovedVariants.indexOf(oNewVariantsModelData.Active.VariantId) !== -1) {
                    oNewVariantsModelData.Active = this._getDefaultVariant();
                }
                oNewVariantsModelData.Items = aVariantsAfterEdit;
                bVariantsEdited = true;
            }

            if (bVariantsEdited) {
                this._updateVariants(oNewVariantsModelData.Items);
            }
        },

        /**
         * Triggered after pressing the button "Save" of the "Variants" popup. Update the active variant information when needed.
         *
         * @public
         *
         * @param {object} oEvent The event
         *
         * @return {void}
         */
        onVariantSave: function(oEvent) {
            var aVariants = this.oFilterBar.getModel("VariantItems").getProperty("/Items"),
                oNewFilter = this.oFilterBar.getModel("VariantFilterModel").getProperty("/"),
                sNewFilter = JSON.stringify(oNewFilter),
                sName = this.oFilterBar.getModel("VariantItems").getProperty("/Active").VariantDisplayName;

            for (var i = aVariants.length - 1; i >= 0; i--) {
                if (aVariants[i].VariantDisplayName === sName &&
                    aVariants[i].VariantContent !== sNewFilter) {
                    aVariants[i].VariantContent = sNewFilter;
                    this._updateVariants();
                    break;
                }
            }
        },

        /**
         * Triggered after pressing the button "Ok" of the "Save Variant" popup. Create the new variant and update the variant information.
         *
         * @public
         *
         * @param {object} oEvent The event
         *
         * @return {void}
         */
        onVariantSaveAs: function(oEvent) {
            var aVariants = this.oFilterBar.getModel("VariantItems").getProperty("/Items"),
                oNewFilter = this.oFilterBar.getModel("VariantFilterModel").getProperty("/"),
                sName = this.oNativeVariantManager.oInputName.getValue().trim(),
                bIsDefault = this.oNativeVariantManager.oDefault.getSelected(),
                oNewVariant,
                oOldDefaultVariant;

            // Only for the planning calendar, if the user doesn't select to save the dates
            // then remove them from the model before saving
            if (this.sAppId === "SAP.COE.PLANNING.CALENDARPilot04") {
                if (!this.bSaveVariants) {
                    delete oNewFilter.startDate;
                    delete oNewFilter.endDate;
                }
            }

            oNewVariant = {
                ApplicationId: this.sAppId,
                VariantSetName: this.sVariantSet,
                VariantDisplayName: sName,
                VariantContent: JSON.stringify(oNewFilter),
                IsDefault: bIsDefault,
                Editable: false,
                ExecuteOnSelect: false
            };

            if (oNewVariant.IsDefault) {
                oOldDefaultVariant = this._getDefaultVariant();
                oOldDefaultVariant.IsDefault = false;
            }

            aVariants.push(oNewVariant);
            this._updateVariants();
        },

        /**
         * Callback after reading variants from the server
         *
         * @public
         *
         * @param {object} oData The data retrieved
         * @param {object} oResponse The response from the server
         *
         * @return {void}
         */
        onReadSuccess: function(oData, oReponse) {
            var oVariantData = {};

            if (oData.VariantDetails.results.length === 0) {
                if (typeof this.vDefaultVariantContent === "function") {
                    this.vDefaultVariantContent();
                    return;
                }
                oData = this.createDefaultVariant(this.vDefaultVariantContent);
            }

            oVariantData.Items = oData.VariantDetails.results;
            oVariantData.Active = this._getDefaultVariant(oVariantData.Items);

            this._refreshVariants(oVariantData);

            if (!this.bPreventSearchAfterLoad) {
                this._updateFilterBarFields();
                this.oFilterBar.search();
                this.bPreventSearchAfterLoad = false;
            }
        },

        /**
         * Callback after create variant from the server
         *
         * @public
         *
         * @param {object} oData The data retrieved
         * @param {object} oResponse The response from the server
         *
         * @return {void}
         */
        onCreateSuccess: function(oData, oResponse) {
            var oVariantData = this.oFilterBar.getModel("VariantItems").getProperty("/"),
                oNewVariant = this._getNewVariantFromResponse(oData.VariantDetails.results),
                bCreatingDefaultVariant = false;

            oVariantData.Items = oData.VariantDetails.results;

            if (oNewVariant) {
                oVariantData.Active = oNewVariant;
            }

            if (!oVariantData.Active) {
                oVariantData.Active = this._getDefaultVariant(oVariantData.Items);
                bCreatingDefaultVariant = true;
            }

            this._refreshVariants(oVariantData);

            if (bCreatingDefaultVariant) {
                this._updateFilterBarFields();
                this.oFilterBar.search();
            }
        },

        /**
         * Callback after server error. It will display the error menssage store in the response.
         *
         * @public
         *
         * @param {object} oResponse The response from the server
         *
         * @return {void}
         */
        onErrorRequest: function(oResponse) {
            sap.m.MessageToast.show(oResponse.error.message.value);
        },

        _init: function() {
            //Template
            var oVMitem = new sap.ui.comp.variants.VariantItem({
                text: "{VariantItems>VariantDisplayName}",
                key: "{VariantItems>VariantId}",
                readOnly: "{VariantItems>IsDefault}"
            });

            this.oFilterBar.setModel(new sap.ui.model.json.JSONModel({ Items: [], Active: undefined }), "VariantItems");

            this.oNativeVariantManager.bindAggregation("variantItems", {
                path: "VariantItems>/Items/",
                template: oVMitem
            });

            //Fixing broken behaviour in the original "on manage save pressed" of the native variant manager
            var that = this,
                fOriginalGetItem = this.oNativeVariantManager.getItemByKey;

            this.oNativeVariantManager.getItemByKey = function(sKey) {
                var oItem = fOriginalGetItem.apply(this, arguments);
                if (!oItem) {
                    oItem = that.oVariantList.getItemByKey(sKey);
                }
                return oItem;
            };

            //Fixing broken behaviour in the original "on selection change" of the native variant manager. Introduced in v1.40.10
            var fOriginalGetSelectedItem = this.oVariantList.getSelectedItem;
            this.oVariantList.getSelectedItem = function() {
                var oItem = fOriginalGetSelectedItem.apply(this, arguments),
                    oActiveVariant;
                if (!oItem) {
                    oActiveVariant = that.oFilterBar.getModel("VariantItems").getProperty("/Active");
                    oItem = that.oVariantList.getItemByKey(oActiveVariant.VariantId);
                }
                return oItem;
            };

            //Set visible the variant manager even if we dont have persistencyKey
            this.oNativeVariantManager.setVisible(true);
        },

        _refreshVariants: function(oNewVariantData) {
            var oVariantModel = this.oFilterBar.getModel("VariantItems"),
                oVariantData = oNewVariantData || oVariantModel.getProperty("/"),
                aItems;

            //Clean native behaviour
            this.oVariantList.destroyItems();
            oVariantModel.setProperty("/", {});

            oVariantModel.setProperty("/", oVariantData);
            aItems = this.oNativeVariantManager._getItems();

            for (var i = 0; i < aItems.length; i++) {
                this.oVariantList.insertItem(aItems[i]);
            }

            this.oNativeVariantManager.oVariantText.setText(oVariantData.Active.VariantDisplayName);
        },

        _getVariants: function() {
            var oModel = this.oFilterBar.getModel(),
                that = this;

            oModel.read("/SearchVariants(ApplicationId='" + this.sAppId + "',VariantSetName='" + this.sVariantSet + "')", {
                urlParameters: {
                    "$expand": "VariantDetails"
                },
                success: that.onReadSuccess.bind(that),
                error: that.onErrorRequest.bind(that)
            });
        },

        _updateVariants: function(aNewVariants) {
            var that = this,
                oModel = this.oFilterBar.getModel(),
                aVariants = aNewVariants || this.oFilterBar.getModel("VariantItems").getProperty("/Items"),
                oResquestCreate = {
                    ApplicationId: this.sAppId,
                    VariantSetName: this.sVariantSet,
                    VariantDetails: aVariants
                };

            oModel.create("/SearchVariants", oResquestCreate, {
                success: that.onCreateSuccess.bind(that),
                error: that.onErrorRequest.bind(that)
            });

            return oResquestCreate;
        },

        _getVariantByKey: function(sKey) {
            var aVariants = this.oFilterBar.getModel("VariantItems").getProperty("/Items");

            for (var i = aVariants.length - 1; i >= 0; i--) {
                if (aVariants[i].VariantId === sKey) {
                    return aVariants[i];
                }
            }

            return null;
        },

        _getDefaultVariant: function(aItems) {
            var aVariants = aItems || this.oFilterBar.getModel("VariantItems").getProperty("/Items");

            for (var i = aVariants.length - 1; i >= 0; i--) {
                if (aVariants[i].IsDefault) {
                    return aVariants[i];
                }
            }

            return null;
        },

        _updateFilterBarFields: function() {
            var oFilterModel = this.oFilterBar.getModel("VariantFilterModel"),
                oActiveVariant = this.oFilterBar.getModel("VariantItems").getProperty("/Active"),
                oVariantContent = JSON.parse(oActiveVariant.VariantContent);

            // Only for the planning calendar,  if the user has saved a date value then use that
            // else use the default date range value
            if (this.sAppId === "SAP.COE.PLANNING.CALENDARPilot04") {
                if (oVariantContent.hasOwnProperty("startDate")) {
                    oVariantContent.startDate = new Date(oVariantContent.startDate);
                    oVariantContent.endDate = new Date(oVariantContent.endDate);
                    oVariantContent.staticDateSaved = true;
                }
                else {
                    oVariantContent.staticDateSaved = false;
                }
            }

            this.oNativeVariantManager.oVariantText.setText(oActiveVariant.VariantDisplayName);
            oFilterModel.setProperty("/", oVariantContent);
        },

        _getNewVariantFromResponse: function(aNewVariants) {
            var aVariants = this.oFilterBar.getModel("VariantItems").getProperty("/Items"),
                oInsertedVariant, oNewVariant;

            for (var i = aVariants.length - 1; i >= 0; i--) {
                if (!aVariants[i].VariantId) {
                    oInsertedVariant = aVariants[i];
                    break;
                }
            }

            if (!oInsertedVariant) {
                return undefined;
            }

            for (i = aNewVariants.length - 1; i >= 0; i--) {
                if (aNewVariants[i].VariantDisplayName === oInsertedVariant.VariantDisplayName) {
                    oNewVariant = aNewVariants[i];
                    break;
                }
            }

            return oNewVariant;
        }
    });
});
