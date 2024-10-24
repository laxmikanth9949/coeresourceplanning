sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/core/format/DateFormat",
    "sap/ui/model/json/JSONModel"
], function(Object, DateFormat, JSONModel) {

    return Object.extend("sap.coe.capacity.reuselib.utils.Helpers", {

        /**
         * Initialize a fragment that will be used by the parent controller
         *
         * @public
         *
         * @param {object} oParentController The parent controller
         * @param {string} sFragment the path of the fragment
         * @param {class} ControllerClass the controller of the fragment. The default is the parent controller when is given null or undefined
         * @param {object} oModel the model of the fragment
         * @param {string} sElementPath the path of the model element to be bound
         *
         * @returns {object} newFragment The new fragment
         */
        initializeFragment: function(oParentController, sFragment, ControllerClass, oModel, sElementPath) {

            return this.initializeFragmentFromObject({
                oParentController: oParentController,
                sFragment: sFragment,
                ControllerClass: ControllerClass,
                oModel: oModel,
                sElementPath: sElementPath
            });
            },


        checkAuthorization: function(sAppKey, oView, oComponent) {
            var sObjectPath;
            var that = this;
            oView.getModel().metadataLoaded().then(function() {
                sObjectPath = oView.getModel().createKey("/ResAuthCheckSet", {
                    AppKey: sAppKey
                });
                oView.getModel().read(sObjectPath, {
                    success: function (oResponse) {
                        if (oResponse.Authorized === false) {
                            that.prepareNoAuthDialogModel(oResponse, oView);
                            oComponent.noAuthDialog.open(oView);
                        }
                    }.bind(this),
                    error: function (oResponse) {
                    }
                });
            });


        },


        prepareNoAuthDialogModel: function(oResponse, oView) {
            //create model for dialog using the network response
            var oDialogModel = new sap.ui.model.json.JSONModel();
            oDialogModel.setData({
                link : oResponse.Link,
                text : oResponse.Message
            });
            oView.setModel(oDialogModel, "NoAuthDialogModel");
        },

        //to prevent apps timing out due to user inactivity we create a timer to make an
        // inexpensive request to the server to keep the session alive
        //oModel has to be odataModel and iInterval is milliseconds delay between request
        preventSessionTimeout: function(oModel, iInterval) {
            setInterval(function(){
                oModel.read("/OrgUnitSet(EmpId='',OrgId='')", {
                });
            }, iInterval);
        },

        /**
         * Initialize a fragment that will be used by the parent controller
         * The parent controller and the fragment controller can be either a controller or a customize component
         * Define in the fragment a "byId" method which is used like the standard byId and takes into account the parent hierarchy
         *
         * @public
         *
         * @param {object} param Object with properties
         * @param {object} param.oParentController The parent controller
         * @param {string} param.sFragment the path of the fragment
         * @param {class} param.ControllerClass the controller of the fragment. The default is the parent controller when is given null or undefined
         * @param {object} param.oModel the model of the fragment
         * @param {string} param.sElementPath the path of the model element to be bound
         * @param {string} param.sCreateId the path of the model element to be bound
         *
         * @returns {object} newFragment The new fragment
         */
        initializeFragmentFromObject: function(param) {
            var newFragment,
                controllerInstance = param.oParentController,
                sFragmentId = param.sCreateId ? param.sCreateId.split("--")[param.sCreateId.split("--").length - 1] + "--" : "",
                that = this;

            if (param.ControllerClass) {
                controllerInstance = new param.ControllerClass();
            }

            if (param.sCreateId) newFragment = sap.ui.xmlfragment(param.sCreateId, param.sFragment, controllerInstance);
            else newFragment = sap.ui.xmlfragment(param.sFragment, controllerInstance);

            if (!controllerInstance.getView || !controllerInstance.getView()) {
                controllerInstance.oView = newFragment;
            }

            newFragment.byId = function(sId) {
                var oParent = newFragment.getParent(),
                    oParentController;
                if (!param.ControllerClass) {
                    oParent = oParent.getParent();
                }
                oParentController = that.getParentController(oParent);
                return oParentController ? oParentController.byId(sFragmentId + sId) : undefined;
            };

            newFragment.getController = function() {
                return controllerInstance;
            };

            controllerInstance.getController = function(){
                return controllerInstance;
            };

            if (param.oModel) newFragment.setModel(param.oModel);
            if (param.sElementPath) newFragment.bindElement(param.sElementPath);

            if (param.oParentController.getView) {
                param.oParentController.getView().addDependent(newFragment);
            } else {
                param.oParentController.addDependent(newFragment);
            }

            return newFragment;
        },

        /**
         * Navigate through all the parents of the element until finding the owner controller
         *
         * @public
         *
         * @param {object} oElement The view or component from who you want its parent controller
         * @return {sap.ui.core.mvc.Controller} The parent controller
         */
        getParentController: function(oElement) {

            if (oElement === undefined) {
                return undefined;
            } else if (oElement.getController !== undefined && oElement.getController() !== undefined) {
                return oElement.getController();
            }

            return oElement.getParent ? this.getParentController(oElement.getParent()) : undefined;
        },


        /**
         * Return the date range of a calendar week taking into account the current date
         *
         * @public
         *
         * @param {string} sCW The calendar week
         *
         * @returns {object} obj.startDate Date object with the first day of the calendar week
         * obj.endDate Date object with the last day of the calendar week
         */
        getDateRangeFromCalendarWeek: function(sCW) {
            var iCW = parseInt(sCW, 10),
                iCurrentCW = parseInt(DateFormat.getDateInstance({ pattern: "w" }, new sap.ui.core.Locale("en-US")).format(new Date()), 10),
                iYear = iCW < iCurrentCW ? new Date().getFullYear() + 1 : new Date().getFullYear(),
                iFirstWeekDayNumberOfYear = new Date(iYear, 0, 1).getDay(),
                oFirstDayOfYear = new Date("Jan 01, " + iYear + " 00:00:00"),
                iMilisecondsToTheMondayOfCW = oFirstDayOfYear.getTime() - (3600000 * 24 * iFirstWeekDayNumberOfYear) + 604800000 * (iCW - 1);

            return {
                startDate: new Date(iMilisecondsToTheMondayOfCW),
                endDate: new Date(iMilisecondsToTheMondayOfCW + 518400000)
            };
        },

        getDateRangeForNumberOfWeeks: function(oDate, iNumWeeksFuture, iNumWeeksPast) {
            var iDate = 0,
                iNumWeeksInPast = iNumWeeksPast ? iNumWeeksPast * 7 : 7;
            // If the date's day of week is Mon to Fri set to first day of week,
            // if it is Sat or Sun set to first day of next week
            if (oDate.getDay() < 6) {
                iDate = (oDate.getDate() - (oDate.getDay() - 1) - iNumWeeksInPast);
            } else {
                iDate = (oDate.getDate() + 2);
            }

            var oStartDate = new Date(oDate.getFullYear(), oDate.getMonth(), iDate),
                oEndDate = new Date(oDate.getFullYear(), oDate.getMonth(), (oDate.getDate() + (iNumWeeksFuture * 7)), 0, 0, -1);

            return [oStartDate, oEndDate];
        },

        /**
         * Return true if the view is named in the same way
         *
         *
         * @public
         *
         * @param {sap.ui.core.mvc.XMLView} oView The object view
         * @param {string} sViewName The name to check
         *
         * @returns {boolean} True if the view is named in the same way
         *
         */
        isViewOf: function(oView, sViewName) {
            return oView.getViewName().indexOf(sViewName) !== -1;
        },


        /**
         * Return new copy of the given model
         *
         *
         * @public
         *
         * @param {sap.ui.model.json.JSONModel} oModel The model to copy
         * @param {string} sPath The path to copy (optional)
         *
         * @returns {sap.ui.model.json.JSONModel} The new instance copy of the model
         *
         */
        copyModel: function(oModel, sPath) {
            var sPathToCopy = sPath ? "/" + sPath : "/",
                aData = oModel.getProperty(sPathToCopy, null,true),
                aDataCopy = jQuery.extend(true, {}, aData);

            return new JSONModel(aDataCopy);
        }

    });
});