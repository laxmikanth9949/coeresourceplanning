jQuery.sap.declare("sap.coe.rpa.util.IsEditableFormatter");
sap.coe.rpa.util.IsEditableFormatter = {

	/**
	 * Check whether arrow ">" should be displayed on the row.
	 * 
	 * @param {String} Data source the data originally is from.
	 * 					"timeallocation": TimeAllocationList
	 * 					"softbooking": SoftbookingSet
	 * 					"assignment": AssighmentList
	 * @return {boolean} If data source is TimeAllocationList, true is returned.
	 * @public
	 */
	isEditable4Arrow: function(value) {
		if (value === "timeallocation") {
			return true;
		}
		return false;
	},

	/**
	 * Check which should be displayed on the row, "Team Member", or "Manager"
	 * 
	 * @param {String} Data source the data is originally from.
	 * 					"timeallocation": TimeAllocationList
	 * 					"softbooking": SoftbookingSet
	 * 					"assignment": AssighmentList
	 * @return {String} If data source is TimeAllocationList,
	 * 					"Team Member" is returned.
	 * 					 In other cases(SoftbookingSet and AssighmentList), "Manager" is returned.
	 * @public
	 */
	whoCreateStaffing: function(value) {
		// for test which will be replaced by the actual logic.
		if (value === "timeallocation") {
			return "Team Member";
		}
		return "Manager";
	}	
};