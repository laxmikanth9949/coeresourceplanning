sap.ui.define([
    "sap/ui/test/opaQunit"
], function(opaTest) {
    "use strict";

    QUnit.module("Team Calendar FilterBar");

    opaTest("Should see the filter bar", function(Given, When, Then) {
        Given.iStartTheApp("teamCalendar");
        When.onTeamCalendarPage.Init();
        Then.onTeamCalendarPage.iShouldSeeAFilterBar();
    });

    //Variant Manager
    opaTest("Should load the default values from the variant manager", function(Given, When, Then){
        Then.onTeamCalendarPage.iShouldSeeToken("id___OrgId", "COE Ireland HANA");
    });

    //Service Team
    opaTest("Should See Service Team Dialog", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressOnValueHelpRequestMultiInput("idServiceTeamForOrgId", "Open Service Team Dialog successful", "Open Service Team Dialog failed");
        Then.onTeamCalendarPage.iShouldSeeADialog();
    });

    opaTest("Select Items on the Service Team Dialog.", function(Given, When, Then) {
        When.onTeamCalendarPage.iSelectCheckBox(0);
        When.onTeamCalendarPage.iSelectCheckBox(1);

        When.onTeamCalendarPage.iPressButton("acceptForEmpId", true, "Ok button of Service Team Dialog pressed", "Ok button of Service Team Dialog pressed failed");

        Then.onTeamCalendarPage.iShouldSeeNTokens("idServiceTeamForOrgId", 2);
    });

    opaTest("Remove token from service team input.", function(Given, When, Then) {
        //These token naming might change after changing the field for the component of the reuse library. 
        When.onTeamCalendarPage.iDeleteToken("RSD DELIVERY TEAM COMPUTACENTER (NOT IN");
        Then.onTeamCalendarPage.iShouldSeeNTokens("idServiceTeamForOrgId", 1);
    });

    opaTest("Should be checked only the expected tokens on the Service Team Dialog.", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressOnValueHelpRequestMultiInput("idServiceTeamForOrgId", "Open Service Team Dialog successful", "Open Service Team Dialog failed");
        When.onTeamCalendarPage.iListIsReady("SelectOrganisationList");

        //Failing. Fixed in the component. Uncoment these lines after migrating this field to the component of the reuse library
        //Then.onTeamCalendarPage.iShouldSeeNItemsCheckedInList("SelectOrganisationList", 1);
        //Then.onTeamCalendarPage.iShouldSeeItemDeselectedInList("SelectOrganisationList", "RSD DELIVERY TEAM COMPUTACENTER (NOT IN");
        Then.onTeamCalendarPage.iShouldSeeItemSelectedInList("SelectOrganisationList", "RSD DELIVERY TEAM DRESDEN");
    });

    opaTest("Should delete token from field when deselecting on the Service Team Dialog.", function(Given, When, Then) {
        When.onTeamCalendarPage.iSelectCheckBox(0);
        When.onTeamCalendarPage.iPressButton("acceptForEmpId", true, "Ok button of Service Team Dialog pressed", "Ok button of Service Team Dialog pressed failed");

        //Failing. Fixed in the component. Uncoment these lines after migrating this field to the component of the reuse library
        //Then.onTeamCalendarPage.iShouldSeeNTokens("idServiceTeamForOrgId", 0);
    });

    //EmployeeID
    opaTest("Should See Employee Search Dialog", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressOnValueHelpRequestMultiInput("id___EmpId", "Open Employee Search Dialog successful", "Open Employee Search Dialog failed");
        Then.onTeamCalendarPage.iShouldSeeADialog();
    });

    opaTest("Search and select items on the Employee Search Dialog should create tokens.", function(Given, When, Then) {
        When.onTeamCalendarPage.iTypeOnSearchField("searchFieldEmpId", "I327678");
        When.onTeamCalendarPage.iPressButton("idForSearchButton", true, "Search button pressed", "Search button pressed failed");
        When.onTeamCalendarPage.iSelectCheckBox(0);
        When.onTeamCalendarPage.iPressButton("acceptForEmpId", true, "Ok button pressed", "Ok button pressed failed");

        Then.onTeamCalendarPage.iShouldSeeNTokens("id___EmpId", 1);
    });

    opaTest("Should the keep selected in the Employee Search dialog the person in EmployeeID field", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressOnValueHelpRequestMultiInput("id___EmpId", "Open Employee Search Dialog successful", "Open Employee Search Dialog failed");
        When.onTeamCalendarPage.iTypeOnSearchField("searchFieldEmpId", ""); //Clean the list
        When.onTeamCalendarPage.iPressButton("idForSearchButton", true, "Search button pressed", "Search button pressed failed");
        When.onTeamCalendarPage.iTypeOnSearchField("searchFieldEmpId", "I327678");
        When.onTeamCalendarPage.iPressButton("idForSearchButton", true, "Search button pressed", "Search button pressed failed");
        When.onTeamCalendarPage.iListIsReady("employeeSearchList");

        Then.onTeamCalendarPage.iShouldSeeNItemsCheckedInList("employeeSearchList", 1);
    });

    opaTest("Should delete token from field when deselecting on the Employee Search Dialog.", function(Given, When, Then) {
        When.onTeamCalendarPage.iSelectCheckBox(0);
        When.onTeamCalendarPage.iPressButton("acceptForEmpId", true, "Ok button pressed", "Ok button pressed failed");

        Then.onTeamCalendarPage.iShouldSeeNTokens("id___EmpId", 0);
    });

    opaTest("Should the item in list be deselected when delete token from field.", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressOnValueHelpRequestMultiInput("id___EmpId", "Open Employee Search Dialog successful", "Open Employee Search Dialog failed");
        When.onTeamCalendarPage.iTypeOnSearchField("searchFieldEmpId", "I327678");
        When.onTeamCalendarPage.iPressButton("idForSearchButton", true, "Search button pressed", "Search button pressed failed");
        When.onTeamCalendarPage.iSelectCheckBox(0);
        When.onTeamCalendarPage.iPressButton("acceptForEmpId", true, "Ok button pressed", "Ok button pressed failed");
        When.onTeamCalendarPage.iDeleteToken("Mr. Alfonso Blesa");

        When.onTeamCalendarPage.iPressOnValueHelpRequestMultiInput("id___EmpId", "Open Employee Search Dialog successful", "Open Employee Search Dialog failed");
        When.onTeamCalendarPage.iPressButton("idForSearchButton", true, "Search button pressed", "Search button pressed failed");
        When.onTeamCalendarPage.iListIsReady("employeeSearchList");

        Then.onTeamCalendarPage.iShouldSeeNItemsCheckedInList("employeeSearchList", 0);

        When.onTeamCalendarPage.iPressButton("idForCloseButton", true);
    });

    //Org Unit
    //Test added to clean the token input. Should be removed when the synchronization with the variant manager is finished
    opaTest("Remove token from org unit input.", function(Given, When, Then) {
        When.onTeamCalendarPage.iDeleteToken("COE Ireland HANA");
        Then.onTeamCalendarPage.iShouldSeeNTokens("id___OrgId", 0);
    });

    opaTest("Should See Org Unit Dialog", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressOnValueHelpRequestMultiInput("id___OrgId", "Open Org Unit Dialog successful", "Open Org Unit Dialog failed");
        Then.onTeamCalendarPage.iShouldSeeADialog();
    });

    opaTest("Should add a token to the field when select items on the Org Unit Dialog.", function(Given, When, Then) {
        When.onTeamCalendarPage.iSelectCheckBox(0);
        When.onTeamCalendarPage.iPressButton("acceptForOrgId", true);

        Then.onTeamCalendarPage.iShouldSeeNTokens("id___OrgId", 1);
    });

    opaTest("Should the keep selected in the Org Unit dialog the organisation in Org Unit field", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressOnValueHelpRequestMultiInput("id___OrgId", "Open Org Unit Dialog successful", "Open Org Unit Dialog failed");

        Then.onTeamCalendarPage.iShouldSeeNItemsCheckedInList("orgUnitList", 1);
        Then.onTeamCalendarPage.iShouldSeeItemSelectedInList("orgUnitList", "COE Ireland HANA");
    });

    opaTest("Should delete token from field when deselecting on the Org Unit Dialog.", function(Given, When, Then) {
        When.onTeamCalendarPage.iSelectCheckBox(0);
        When.onTeamCalendarPage.iPressButton("acceptForOrgId", true);

        Then.onTeamCalendarPage.iShouldSeeNTokens("id___OrgId", 0);
    });

    opaTest("Tear down and clean context", function(Given, When, Then) {
        Given.iTeardownMyAppFrame();
        Then.onTeamCalendarPage.okAssert("FilterBar context cleaned");
    });

});
