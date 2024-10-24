sap.ui.define([
    "sap/ui/test/opaQunit"
], function(opaTest) {
    "use strict";

    QUnit.module("Team Calendar Frontend Filter");

    opaTest("Should see the frontend filter button", function(Given, When, Then) {
        Given.iStartTheApp("teamCalendar");

        When.onTeamCalendarPage.Init();
        Then.onTeamCalendarPage.iShouldSeeAFilterBar(); //The elements of the page are rendered
        Then.onTeamCalendarPage.iShouldSeeButton("idOpenCalendarSettings");
    });

    //Load the dialog
    opaTest("Should open the frontend filter popup", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        Then.onTeamCalendarPage.iShouldSeeADialog();
    });

    //onsite
    opaTest("Should filter 'onsite' be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iClickListItem(1); //Location
        When.onTeamCalendarPage.iSelectRadioButton(0); //onsite
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Blesa");
        Then.onTeamCalendarPage.iShouldNotSeePersonInCalendar("Murphy");
    });

    //Reset
    opaTest("Should reset filter 'onsite' be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iPressButton("detailresetbutton");
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Murphy");
    });

    //remote
    opaTest("Should filter 'remote' be correctly applied", function(Given, When, Then) {
        //Inestable test. It is needed to perform some steps manually in the frame for the test to work
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iClickListItem(1); //Location
        When.onTeamCalendarPage.iSelectRadioButton(1); //remote
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Murphy");
        Then.onTeamCalendarPage.iShouldNotSeePersonInCalendar("Benito");
    });

    //No Travel/Remote only
    opaTest("Should filter 'No Travel/Remote only' be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iPressButton("detailresetbutton");
        When.onTeamCalendarPage.iClickListItem(0); //Time Allocations
        When.onTeamCalendarPage.iSelectCheckBox(1); //No Travel/Remote only
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Lampon");
        Then.onTeamCalendarPage.iShouldNotSeePersonInCalendar("Murphy");
    });

    //Abscence
    opaTest("Should filter 'Abscence' be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iSelectCheckBox(1); //Deselect 
        When.onTeamCalendarPage.iSelectCheckBox(2); //Absence
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Murphy");
        Then.onTeamCalendarPage.iShouldNotSeePersonInCalendar("Lampon");
    });

    //EOD
    opaTest("Should filter 'EOD' be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iSelectCheckBox(2); //Deselect
        When.onTeamCalendarPage.iSelectCheckBox(3);//EOD
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Caetano");
        Then.onTeamCalendarPage.iShouldNotSeePersonInCalendar("Murphy");
    });

    //Backoffice Duty
    opaTest("Should filter 'Backoffice Duty' be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iSelectCheckBox(3); //Deselect
        When.onTeamCalendarPage.iSelectCheckBox(4);//Backoffice Duty
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Dickens");
        Then.onTeamCalendarPage.iShouldNotSeePersonInCalendar("Caetano");
    });

    //No travel/Remote Only
    opaTest("Should filter 'No travel/Remote Only' be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iSelectCheckBox(4);//Deselect
        When.onTeamCalendarPage.iSelectCheckBox(5);//Remote Only
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Lampon");
        Then.onTeamCalendarPage.iShouldNotSeePersonInCalendar("Dickens");
    });

    //Office Blocked
    opaTest("Should filter 'Office Blocked' be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iSelectCheckBox(5); 
        When.onTeamCalendarPage.iSelectCheckBox(6);//Office Blocked
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Jain");
        Then.onTeamCalendarPage.iShouldNotSeePersonInCalendar("Lampon");
    });

    //Trainer
    opaTest("Should filter 'Trainer' be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iSelectCheckBox(6); //Deselect
        When.onTeamCalendarPage.iSelectCheckBox(7);//Trainer
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Ponisi");
        Then.onTeamCalendarPage.iShouldNotSeePersonInCalendar("Jain");
    });

    //Trainee
    opaTest("Should filter 'Trainee' be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iSelectCheckBox(7); //Deselect
        When.onTeamCalendarPage.iSelectCheckBox(8);//Trainee
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Murphy");
        Then.onTeamCalendarPage.iShouldNotSeePersonInCalendar("Ponisi");
    });

    //Escalation
    opaTest("Should filter 'Escalation' be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iSelectCheckBox(8); //Deselect
        When.onTeamCalendarPage.iSelectCheckBox(9);//Escalation
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Massanet");
        Then.onTeamCalendarPage.iShouldNotSeePersonInCalendar("Murphy");
    });

    //Project Work
    opaTest("Should filter 'Project Work' be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iSelectCheckBox(9); //Deselect
        When.onTeamCalendarPage.iSelectCheckBox(10);//Project Work
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Gurjar");
        Then.onTeamCalendarPage.iShouldNotSeePersonInCalendar("Massanet");
    });

    //Development
    opaTest("Should filter 'Development' be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iSelectCheckBox(10); //Deselect
        When.onTeamCalendarPage.iSelectCheckBox(11);//Development
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("McDonnel");
        Then.onTeamCalendarPage.iShouldNotSeePersonInCalendar("Massanet");
    });

    //Tentative Service
    opaTest("Should filter 'Tentative Service' be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iSelectCheckBox(11); //Deselect
        When.onTeamCalendarPage.iSelectCheckBox(12);//Tentative Service
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Derek");
        Then.onTeamCalendarPage.iShouldNotSeePersonInCalendar("McDonnel");
    });

    //Real Time Expertise
    opaTest("Should filter 'Real Time Expertise' be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iSelectCheckBox(12); //Deselect
        When.onTeamCalendarPage.iSelectCheckBox(13);//Real Time Expertise
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Xavier");
        Then.onTeamCalendarPage.iShouldNotSeePersonInCalendar("Derek");
    });

    //MultiSelect: Only rem. Service del. Possible & Office Blocked
    opaTest("Filter 'Only rem. Service del. Possible' & Office Blocked Should be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iSelectCheckBox(12);//Deselect
        When.onTeamCalendarPage.iSelectCheckBox(13);//Deselect
        When.onTeamCalendarPage.iSelectCheckBox(5); //Only rem. Service del. Possible
        When.onTeamCalendarPage.iSelectCheckBox(6);//Office Blocked
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Jain");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Lampon");
        Then.onTeamCalendarPage.iShouldNotSeePersonInCalendar("Murphy");
    });

    //MultiSelect: Trainer & Trainee
    opaTest("Filter 'Trainer' & 'Trainee' should be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iSelectCheckBox(5); //Deselect
        When.onTeamCalendarPage.iSelectCheckBox(6); //Deselect
        When.onTeamCalendarPage.iSelectCheckBox(7); //Trainer
        When.onTeamCalendarPage.iSelectCheckBox(8); //Trainee  
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Ponisi");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Murphy");
        Then.onTeamCalendarPage.iShouldNotSeePersonInCalendar("Lampon");
        Then.onTeamCalendarPage.iShouldNotSeePersonInCalendar("Jain");
    });    

    //MultiSelect: Absense, EOD & Escalation
    opaTest("Filter 'Absense', 'EOD' & 'Escalation' should be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iSelectCheckBox(7); //Deselect
        When.onTeamCalendarPage.iSelectCheckBox(8); //Deselect
        When.onTeamCalendarPage.iSelectCheckBox(2);//Absense
        When.onTeamCalendarPage.iSelectCheckBox(3);//EOD
        When.onTeamCalendarPage.iSelectCheckBox(9); //Escalation
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Caetano");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Murphy");
        Then.onTeamCalendarPage.iShouldNotSeePersonInCalendar("Lampon");
    });

    //Reset
    opaTest("Reset filter should be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iPressButton("detailresetbutton");
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Murphy");
    });    


    //MultiSelect: Absense & Onsite
    opaTest("Filter 'Absense', 'Onsite' should be correctly applied", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressButton("idOpenCalendarSettings");
        When.onTeamCalendarPage.iClickListItem(0); //Time Allocations
        When.onTeamCalendarPage.iSelectCheckBox(2);//Absense
        When.onTeamCalendarPage.iPressButton("backbutton");
        When.onTeamCalendarPage.iClickListItem(1); //Time Allocations
        When.onTeamCalendarPage.iSelectRadioButton(0); //onsite
        When.onTeamCalendarPage.iPressButton("acceptbutton");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Murphy");
        Then.onTeamCalendarPage.iShouldSeePersonInCalendar("Blesa");
    });

    opaTest("Tear down and clean context", function(Given, When, Then) {
        Given.iTeardownMyAppFrame();
        Then.onTeamCalendarPage.okAssert("Frontend filter context cleaned");
    });
});
