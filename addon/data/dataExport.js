function dataExport(options) {
  // Load a blank page and then inject the HTML to work around https://bugzilla.mozilla.org/show_bug.cgi?id=792479
  // An empty string as URL loads about:blank synchronously
  var popupWin;
  if (window.unsafeWindow && window.XPCNativeWrapper) {
    // Firefox
    // Use unsafeWindow to work around https://bugzilla.mozilla.org/show_bug.cgi?id=996069
    popupWin = new XPCNativeWrapper(unsafeWindow.open("", "", "width=900,height=800,scrollbars=yes"));
  } else {
    // Chrome
    popupWin = open("", "", "width=900,height=800,scrollbars=yes");
  }
  window.addEventListener("pagehide", function() {
    // All JS runs in the parent window, and will stop working when the parent goes away. Therefore close the popup.
    popupWin.close();
  });
  var document = popupWin.document;
  document.head.innerHTML = '\
  <title>Data Export</title>\
  <style>\
  body {\
    font-family: Arial, Helvetica, sans-serif;\
    font-size: 11px;\
    overflow: hidden;\
    margin-top: 0;\
  }\
  #user-info {\
    background-color: #1797c0;\
    color: white;\
    padding: .5em;\
    border-radius: 0 0 10px 10px;\
    margin-bottom: 8px;\
  }\
  textarea {\
    display:block;\
    width: 100%;\
    resize: vertical;\
    word-wrap: normal;\
    font-size: 11px;\
  }\
  textarea[hidden] {\
    display: none;\
  }\
  table {\
    border-collapse: collapse;\
  }\
  th, td {\
    text-align: left;\
    font-size: 11px;\
    border: 1px solid gray;\
    background-color: white;\
    white-space: pre;\
  }\
  #result-box {\
    margin-top: 3px;\
    overflow: auto;\
  }\
  #query {\
    height: 5em;\
    margin-top: 3px;\
  }\
  #result-text {\
    height: calc(100% - 2px);\
    resize: none;\
    white-space: pre;\
  }\
  .area {\
    background-color: #F8F8F8;\
    padding: 3px;\
    border-radius: 5px;\
    border: 1px solid #E0E3E5;\
    border-top: 3px solid #1797C0;\
  }\
  h1 {\
    font-size: 1.2em;\
    margin: 0px;\
    display: inline;\
  }\
  .action-arrow {\
    text-align: center;\
  }\
  .arrow-body {\
    background-color: green;\
    width: 100px;\
    margin: 0 auto;\
    padding-top: 5px;\
  }\
  .arrow-head {\
    border-left: 50px solid transparent;\
    border-right: 50px solid transparent;\
    border-top: 15px solid green;\
    width: 0;\
    margin: 0 auto -8px;\
    position: relative;\
  }\
  .area input[type="radio"], .area input[type="checkbox"] {\
    margin: 0 2px 0 0;\
  }\
  .area label {\
    padding-left: 10px;\
    white-space: nowrap;\
  }\
  .area * {\
    vertical-align: middle\
  }\
  .query-history {\
    width: 9em;\
  }\
  #export-help-btn {\
    float: right;\
    margin-top: 3px;\
  }\
  #autocomplete-results {\
    white-space: nowrap;\
    overflow: hidden;\
  }\
  #autocomplete-results.expanded {\
    white-space: normal;\
  }\
  #spinner {\
    position: absolute;\
    left: -15px;\
    top: -15px;\
  }\
  .cancel-btn {\
    float: right;\
    height: 1.3em;\
    border: 1px solid gray;\
  }\
  .char-btn {\
    color: white;\
    text-decoration: none;\
    background-color: gray;\
    display: inline-block;\
    width: 14px;\
    height: 14px;\
    border-radius: 7px;\
    line-height: 14px;\
    text-align: center;\
  }\
  </style>\
  ';

  document.body.innerHTML = '\
  <img id="spinner" src="data:image/gif;base64,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" data-bind="visible: spinnerCount() > 0">\
  <div id="user-info" data-bind="text: userInfo"></div>\
  <div class="area">\
    <h1>Export query</h1>\
    <label><input type="checkbox" data-bind="checked: queryAll, disable: queryTooling"> <span>Include deleted and archived records?</span></label>\
    <label title="With the tooling API you can query more metadata, but you cannot query regular data"><input type="checkbox" data-bind="checked: queryTooling, disable: queryAll"> <span>Use Tooling API?</span></label>\
    <label>\
      <select data-bind="options: queryHistory, optionsCaption: \'Query history\', value: selectedHistoryEntry, event: {change: selectHistoryEntry}" class="query-history"></select>\
      <a href="about:blank" data-bind="click: clearHistory" title="Clear query history" class="char-btn">X</a>\
    </label>\
    <a href="about:blank" id="export-help-btn" data-bind="click: toggleHelp">Export help</a>\
    <textarea id="query" data-bind="style: {maxHeight: (winInnerHeight() - 200) + \'px\'}"></textarea>\
    <div id="autocomplete-results" data-bind="css: {expanded: expandAutocomplete}">\
      <a href="about:blank" class="char-btn" data-bind="click: showDescribe, visible: sobjectName(), attr: {title: \'Show field info for the \' + sobjectName() + \' object\'}">i</a>\
      <a href="about:blank" class="char-btn" data-bind="click: toggleExpand, text: expandAutocomplete() ? \'-\' : \'+\'" title="Show all suggestions or only the first line"></a>\
      <span data-bind="text: autocompleteTitle"></span>\
      <span data-bind="foreach: autocompleteResults">\
        <a data-bind="text: value, attr: {title: title}, click: $parent.autocompleteClick" href="about:blank"></a>\
      </span>\
    </div>\
    <div data-bind="visible: showHelp">\
      <p>Use for quick one-off data exports. Enter a <a href="http://www.salesforce.com/us/developer/docs/soql_sosl/" target="_blank">SOQL query</a> in the box above and press Export.</p>\
      <p>Press Ctrl+Space to insert all field name autosuggestions or to load suggestions for field values.</p>\
      <p>Supports the full SOQL language. The columns in the CSV output depend on the returned data. Using subqueries may cause the output to grow rapidly. Bulk API is not supported. Large data volumes may freeze or crash your browser.</p>\
    </div>\
  </div>\
  <div class="action-arrow">\
    <div class="arrow-body"><button data-bind="disable: exportResultVm().isWorking, click: doExport">Export</button></div>\
    <div class="arrow-head"></div>\
  </div>\
  <div class="area" id="result-area">\
    <h1>Export result</h1>\
    <label><input type=radio name="data-format" value="table" data-bind="checked: dataFormat"> <span>Table</span></label>\
    <label><input type=radio name="data-format" value="excel" data-bind="checked: dataFormat"> <span>Excel</span></label>\
    <label><input type=radio name="data-format" value="csv" data-bind="checked: dataFormat"> <span>CSV</span></label>\
    <label><input type=radio name="data-format" value="json" data-bind="checked: dataFormat"> <span>JSON</span></label>\
    <button class="cancel-btn" data-bind="visible: exportResultVm().isWorking, click: stopExport">Stop</button>\
    <div id="result-box" data-bind="style: {height: (winInnerHeight() - resultBoxOffsetTop() - 25) + \'px\'}">\
      <textarea id="result-text" readonly data-bind="text: exportResultVm().resultText, visible: !exportResultVm().resultTable"></textarea>\
      <table data-bind="if: exportResultVm().resultTable">\
        <thead>\
          <tr>\
            <th>+</th>\
            <!-- ko foreach: exportResultVm().resultTable.header -->\
              <th data-bind="text: $data"></th>\
            <!-- /ko -->\
          </tr>\
        </thead>\
        <tbody data-bind="foreach: exportResultVm().resultTable.data">\
          <tr>\
            <td><a href="about:blank" title="Show all data" data-bind="click: openAllData">+</a></td>\
            <!-- ko foreach: cells -->\
              <td data-bind="text: $data"></td>\
            <!-- /ko -->\
          </tr>\
        </tnody>\
      </table>\
    </div>\
  </div>\
  ';

  var queryInput = document.querySelector("#query");

  var queryInputVm = {
    setValue: function(v) { queryInput.value = v; },
    getValue: function() { return queryInput.value; },
    getSelStart: function() { return queryInput.selectionStart; },
    getSelEnd: function() { return queryInput.selectionEnd; },
    insertText: function(text, selStart, selEnd) {
      queryInput.focus();
      queryInput.setRangeText(text, selStart, selEnd, "end");
    }
  };

  var queryHistoryStorage = {
    get: function() { return localStorage.insextQueryHistory; },
    set: function(v) { localStorage.insextQueryHistory = v; },
    clear: function() { localStorage.removeItem("insextQueryHistory"); }
  };

  var vm = dataExportVm(options, queryInputVm, queryHistoryStorage);
  ko.applyBindings(vm, document.documentElement);

  function queryAutocompleteEvent() {
    vm.queryAutocompleteHandler();
  }
  queryInput.addEventListener("input", queryAutocompleteEvent);
  queryInput.addEventListener("select", queryAutocompleteEvent);
  // There is no event for when caret is moved without any selection or value change, so use keyup and mouseup for that.
  queryInput.addEventListener("keyup", queryAutocompleteEvent);
  queryInput.addEventListener("mouseup", queryAutocompleteEvent);

  // We do not want to perform Salesforce API calls for autocomplete on every keystroke, so we only perform these when the user pressed Ctrl+Space
  queryInput.addEventListener("keypress", function(e) {
    if (e.charCode == 32 /* space */ && e.ctrlKey) {
      e.preventDefault();
      vm.queryAutocompleteHandler({ctrlSpace: true});
    }
  });

  var resultBox = document.querySelector("#result-box");
  function recalculateHeight() {
    vm.resultBoxOffsetTop(resultBox.offsetTop);
  }
  queryInput.addEventListener("mousemove", recalculateHeight);
  popupWin.addEventListener("mouseup", recalculateHeight);
  popupWin.addEventListener("resize", function() {
    vm.winInnerHeight(popupWin.innerHeight);
    recalculateHeight(); // a resize event is fired when the window is opened after resultBox.offsetTop has been initialized, so initializes vm.resultBoxOffsetTop
  });

}

function dataExportVm(options, queryInput, queryHistoryStorage) {
  options = options || {};
  var exportResult = ko.observable({isWorking: false, exportStatus: "", exportedRecords: [], exportedTooling: false});

  var vm = {
    spinnerCount: ko.observable(0),
    showHelp: ko.observable(false),
    userInfo: ko.observable("..."),
    winInnerHeight: ko.observable(0),
    resultBoxOffsetTop: ko.observable(0),
    queryAll: ko.observable(false),
    queryTooling: ko.observable(false),
    autocompleteTitle: ko.observable("\u00A0"),
    autocompleteResults: ko.observable([]),
    dataFormat: ko.observable("excel"),
    autocompleteClick: null,
    exportResultVm: ko.computed(computeExportResultVm),
    queryHistory: ko.observable(getQueryHistory()),
    selectedHistoryEntry: ko.observable(),
    sobjectName: ko.observable(""),
    expandAutocomplete: ko.observable(false),
    toggleHelp: function() {
      vm.showHelp(!vm.showHelp());
    },
    toggleExpand: function() {
      vm.expandAutocomplete(!vm.expandAutocomplete());
    },
    showDescribe: function() {
      showAllData({
        recordAttributes: {type: vm.sobjectName(), url: null},
        useToolingApi: vm.queryTooling()
      });
    },
    selectHistoryEntry: function() {
      if (vm.selectedHistoryEntry() != undefined) {
        queryInput.setValue(vm.selectedHistoryEntry());
        vm.selectedHistoryEntry(undefined);
      }
    },
    clearHistory: function() {
      clearQueryHistory();
      vm.queryHistory([]);
    },
    queryAutocompleteHandler: queryAutocompleteHandler,
    doExport: doExport,
    stopExport: stopExport
  };

  function spinFor(promise) {
    vm.spinnerCount(vm.spinnerCount() + 1);
    promise.catch(function (e) { console.error("spinFor", e); }).then(stopSpinner, stopSpinner);
  }
  function stopSpinner() {
    vm.spinnerCount(vm.spinnerCount() - 1);
  }

  /**
   * sobjectDescribes is a map.
   * Keys are lowercased sobject API names.
   * Values are DescribeGlobalSObjectResult objects with two extra properties:
   *   - The "fields" property contains and array of DescribeFieldResult objects of all fields on the given sobject.
   *     The "fields" property does not exist if fields are not yet loaded.
   *   - The "fieldsRequest" contains a boolean, which is true if fields are loaded or a request to load them is in progress.
   */
  var sobjectDataDescribes = {};
  var sobjectToolingDescribes = {};
  var describeState = 0;
  function maybeGetFields(sobjectDescribe) {
    if (!sobjectDescribe.fieldsRequest) {
      console.log("getting fields for " + sobjectDescribe.name);
      sobjectDescribe.fieldsRequest = true;
      spinFor(askSalesforce(sobjectDescribe.urls.describe).then(function(res) {
        sobjectDescribe.fields = res.fields;
        describeState++;
        queryAutocompleteHandler();
      }, function() {
        sobjectDescribe.fieldsRequest = false; // Request failed, allow trying again
      }));
    }
  }
  spinFor(askSalesforce("/services/data/v33.0/sobjects/").then(function(res) {
    res.sobjects.forEach(function(sobjectDescribe) {
      sobjectDataDescribes[sobjectDescribe.name.toLowerCase()] = sobjectDescribe;
    });
    describeState++;
    queryAutocompleteHandler();
  }));
  spinFor(askSalesforce("/services/data/v33.0/tooling/sobjects/").then(function(res) {
    res.sobjects.forEach(function(sobjectDescribe) {
      sobjectToolingDescribes[sobjectDescribe.name.toLowerCase()] = sobjectDescribe;
    });
    describeState++;
    queryAutocompleteHandler();
  }));

  spinFor(askSalesforceSoap("<getUserInfo/>").then(function(res) {
    vm.userInfo(res.querySelector("Body userFullName").textContent + " / " + res.querySelector("Body userName").textContent + " / " + res.querySelector("Body organizationName").textContent);
  }));

  queryInput.setValue(options.query || vm.queryHistory()[0] || "select Id from Account");

  /**
   * SOQL query autocomplete handling.
   * Put caret at the end of a word or select some text to autocomplete it.
   * Searches for both label and API name.
   * Autocompletes sobject names after the "from" keyword.
   * Autocompletes field names, if the "from" keyword exists followed by a valid object name.
   * Supports relationship fields.
   * Autocompletes field values (picklist values, date constants, boolean values).
   * Autocompletes any textual field value by performing a Salesforce API query when Ctrl+Space is pressed.
   * Inserts all autocomplete field suggestions when Ctrl+Space is pressed.
   * Does not yet support subqueries.
   */
  var autocompleteState = "";
  var autocompleteProgress = {};
  function queryAutocompleteHandler(e) {
    var sobjectDescribes = vm.queryTooling() ? sobjectToolingDescribes : sobjectDataDescribes;
    var query = queryInput.getValue();
    var selStart = queryInput.getSelStart();
    var selEnd = queryInput.getSelEnd();
    var ctrlSpace = e && e.ctrlSpace;

    // Skip the calculation when no change is made. This improves performance and prevents async operations (Ctrl+Space) from being canceled when they should not be.
    var newAutocompleteState = [vm.queryTooling(), describeState, query, selStart, selEnd].join("$");
    if (newAutocompleteState == autocompleteState && !ctrlSpace) {
      return;
    }
    autocompleteState = newAutocompleteState;

    // Cancel any async operation since its results will no longer be relevant.
    if (autocompleteProgress.abort) {
      autocompleteProgress.abort();
    }

    vm.autocompleteClick = function(item) {
      queryInput.insertText(item.value + item.suffix, selStart, selEnd);
      queryAutocompleteHandler();
    };

    // Find the token we want to autocomplete. This is the selected text, or the last word before the cursor.
    var searchTerm = selStart != selEnd
      ? query.substring(selStart, selEnd)
      : query.substring(0, selStart).match(/[a-zA-Z0-9_]*$/)[0];
    selStart = selEnd - searchTerm.length;

    // If we are just after the "from" keyword, autocomplete the sobject name
    if (query.substring(0, selStart).match(/(^|\s)from\s*$/)) {
      var ar = [];
      for (var sName in sobjectDescribes) {
        var sobjectDescribe = sobjectDescribes[sName];
        if (sobjectDescribe.name.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1 || sobjectDescribe.label.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1) {
          ar.push({value: sobjectDescribe.name, title: sobjectDescribe.label, suffix: " "});
        }
      }
      vm.sobjectName("");
      vm.autocompleteTitle("Objects:");
      vm.autocompleteResults(ar);
      return;
    }

    // Find out what sobject we are querying, by using the word after the "from" keyword.
    // Assuming no subqueries, we should find the correct sobjectName. There should be only one "from" keyword, and strings (which may contain the word "from") are only allowed after the real "from" keyword.
    var fromKeywordMatch = /(^|\s)from\s*([a-zA-Z0-9_]*)/.exec(query);
    if (!fromKeywordMatch) {
      vm.sobjectName("");
      vm.autocompleteTitle("\"from\" keyword not found");
      vm.autocompleteResults([]);
      return;
    }
    var sobjectName = fromKeywordMatch[2];
    var isBeforeFrom = selStart > fromKeywordMatch.index + 1;
    vm.sobjectName(sobjectName);
    var sobjectDescribe = sobjectDescribes[sobjectName.toLowerCase()];

    if (!sobjectDescribe) {
      vm.autocompleteTitle("Unknown object: " + sobjectName);
      vm.autocompleteResults([]);
      return;
    }
    if (!sobjectDescribe.fields) {
      maybeGetFields(sobjectDescribe);
      vm.autocompleteTitle("Loading metadata for object: " + sobjectName);
      vm.autocompleteResults([]);
      return;
    }

    /*
     * The context of a field is used to support queries on relationship fields.
     *
     * For example: If the cursor is at the end of the query "select Id from Contact where Account.Owner.Usern"
     * then the the searchTerm we want to autocomplete is "Usern", the contextPath is "Account.Owner." and the sobjectName is "Contact"
     *
     * When autocompleting field values in the query "select Id from Contact where Account.Type = 'Cus"
     * then the searchTerm we want to autocomplete is "Cus", the fieldName is "Type", the contextPath is "Account." and the sobjectName is "Contact"
     */

    var contextEnd = selStart;

    // If we are on the right hand side of a comparison operator, autocomplete field values
    var isFieldValue = query.substring(0, selStart).match(/\s*[<>=!]+\s*('?[^'\s]*)$/);
    var fieldName = null;
    if (isFieldValue) {
      var fieldEnd = selStart - isFieldValue[0].length;
      fieldName = query.substring(0, fieldEnd).match(/[a-zA-Z0-9_]*$/)[0];
      contextEnd = fieldEnd - fieldName.length;
      selStart -= isFieldValue[1].length;
    }

    /*
    contextSobjectDescribes is a set of describe results for the relevant context sobjects.
    Example: "select Subject, Who.Name from Task"
    The context sobjects for "Subject" is {"Task"}.
    The context sobjects for "Who" is {"Task"}.
    The context sobjects for "Name" is {"Contact", "Lead"}.
    */
    var contextSobjectDescribes = [sobjectDescribe];
    var contextPath = query.substring(0, contextEnd).match(/[a-zA-Z0-9_\.]*$/)[0];
    var isLoading = false;
    if (contextPath) {
      var contextFields = contextPath.split(".");
      contextFields.pop(); // always empty
      contextFields.forEach(function(referenceFieldName) {
        var newContextSobjectDescribes = new Set();
        contextSobjectDescribes.forEach(function(sobjectDescribe) {
          sobjectDescribe.fields
            .filter(function(field) { return field.relationshipName && field.relationshipName.toLowerCase() == referenceFieldName.toLowerCase(); })
            .forEach(function(field) {
              field.referenceTo.forEach(function(referencedSobjectName) {
                var referencedSobjectDescribe = sobjectDescribes[referencedSobjectName.toLowerCase()];
                if (referencedSobjectDescribe) {
                  if (referencedSobjectDescribe.fields) {
                    newContextSobjectDescribes.add(referencedSobjectDescribe);
                  } else {
                    maybeGetFields(referencedSobjectDescribe);
                    isLoading = true;
                  }
                }
              });
            });
        });
        contextSobjectDescribes = [];
        newContextSobjectDescribes.forEach(function(d) { contextSobjectDescribes.push(d); });
      });
    }

    if (contextSobjectDescribes.length == 0) {
      vm.autocompleteTitle(isLoading ? "Loading metadata..." : "Unknown field: " + sobjectName + "." + contextPath);
      vm.autocompleteResults([]);
      return;
    }

    if (isFieldValue) {
      // Autocomplete field values
      var contextValueFields = [];
      contextSobjectDescribes.forEach(function(sobjectDescribe) {
        sobjectDescribe.fields
          .filter(function(field) { return field.name.toLowerCase() == fieldName.toLowerCase(); })
          .forEach(function(field) {
            contextValueFields.push({sobjectDescribe: sobjectDescribe, field: field});
          });
      });
      if (contextValueFields.length == 0) {
        vm.autocompleteTitle("Unknown field: " + sobjectDescribe.name + "." + contextPath + fieldName);
        vm.autocompleteResults([]);
        return;
      }
      var fieldNames = contextValueFields.map(function(contextValueField) { return contextValueField.sobjectDescribe.name + "." + contextValueField.field.name; }).join(", ");
      if (ctrlSpace) {
        // Since this performs a Salesforce API call, we ask the user to opt in by pressing Ctrl+Space
        if (contextValueFields.length > 1) {
          vm.autocompleteTitle("Multiple possible fields: " + fieldNames);
          vm.autocompleteResults([]);
          return;
        }
        var sobjectDescribe = contextValueFields[0].sobjectDescribe;
        var field = contextValueFields[0].field;
        var queryMethod = vm.queryTooling() ? "tooling/query" : vm.queryAll() ? "queryAll" : "query";
        var acQuery = "select " + field.name + " from " + sobjectDescribe.name + " where " + field.name + " like '%" + searchTerm.replace(/'/g, "\\'") + "%' group by " + field.name + " limit 100";
        spinFor(askSalesforce("/services/data/v33.0/" + queryMethod + "/?q=" + encodeURIComponent(acQuery), autocompleteProgress)
          .catch(function(xhr) {
            vm.autocompleteTitle("Error: " + (xhr && xhr.responseText));
            return null;
          })
          .then(function queryHandler(data) {
            autocompleteProgress = {};
            if (!data) {
              return;
            }
            var ar = [];
            data.records.forEach(function(record) {
              var value = record[field.name];
              if (value) {
                ar.push({value: "'" + value + "'", title: value, suffix: " "});
              }
            });
            vm.autocompleteTitle(fieldNames + " values:");
            vm.autocompleteResults(ar);
          }));
        vm.autocompleteTitle("Loading " + fieldNames + " values...");
        vm.autocompleteResults([]);
        return;
      }
      var ar = [];
      contextValueFields.forEach(function(contextValueField) {
        var field = contextValueField.field;
        field.picklistValues.forEach(function(pickVal) {
          ar.push({value: "'" + pickVal.value + "'", title: pickVal.label, suffix: " "});
        });
        if (field.type == "boolean") {
          ar.push({value: "true", title: "true", suffix: " "});
          ar.push({value: "false", title: "false", suffix: " "});
        }
        if (field.type == "date" || field.type == "datetime") {
          function pad(n, d) {
            return ("000" + n).slice(-d);
          }
          var d = new Date();
          if (field.type == "date") {
            ar.push({value: pad(d.getFullYear(), 4) + "-" + pad(d.getMonth() + 1, 2) + "-" + pad(d.getDate(), 2), title: "Today", suffix: " "});
          }
          if (field.type == "datetime") {
            ar.push({value: pad(d.getFullYear(), 4) + "-" + pad(d.getMonth() + 1, 2) + "-" + pad(d.getDate(), 2) + "T"
              + pad(d.getHours(), 2) + ":" + pad(d.getMinutes(), 2) + ":" + pad(d.getSeconds(), 2) + "." + pad(d.getMilliseconds(), 3)
              + (d.getTimezoneOffset() <= 0 ? "+" : "-") + pad(Math.floor(Math.abs(d.getTimezoneOffset()) / 60), 2)
              + ":" + pad(Math.abs(d.getTimezoneOffset()) % 60, 2), title: "Now", suffix: " "});
          }
          // from http://www.salesforce.com/us/developer/docs/soql_sosl/Content/sforce_api_calls_soql_select_dateformats.htm Spring 15
          ar.push({value: "YESTERDAY", title: "Starts 12:00:00 the day before and continues for 24 hours.", suffix: " "});
          ar.push({value: "TODAY", title: "Starts 12:00:00 of the current day and continues for 24 hours.", suffix: " "});
          ar.push({value: "TOMORROW", title: "Starts 12:00:00 after the current day and continues for 24 hours.", suffix: " "});
          ar.push({value: "LAST_WEEK", title: "Starts 12:00:00 on the first day of the week before the most recent first day of the week and continues for seven full days. First day of the week is determined by your locale.", suffix: " "});
          ar.push({value: "THIS_WEEK", title: "Starts 12:00:00 on the most recent first day of the week before the current day and continues for seven full days. First day of the week is determined by your locale.", suffix: " "});
          ar.push({value: "NEXT_WEEK", title: "Starts 12:00:00 on the most recent first day of the week after the current day and continues for seven full days. First day of the week is determined by your locale.", suffix: " "});
          ar.push({value: "LAST_MONTH", title: "Starts 12:00:00 on the first day of the month before the current day and continues for all the days of that month.", suffix: " "});
          ar.push({value: "THIS_MONTH", title: "Starts 12:00:00 on the first day of the month that the current day is in and continues for all the days of that month.", suffix: " "});
          ar.push({value: "NEXT_MONTH", title: "Starts 12:00:00 on the first day of the month after the month that the current day is in and continues for all the days of that month.", suffix: " "});
          ar.push({value: "LAST_90_DAYS", title: "Starts 12:00:00 of the current day and continues for the last 90 days.", suffix: " "});
          ar.push({value: "NEXT_90_DAYS", title: "Starts 12:00:00 of the current day and continues for the next 90 days.", suffix: " "});
          ar.push({value: "LAST_N_DAYS:n", title: "For the number n provided, starts 12:00:00 of the current day and continues for the last n days.", suffix: " "});
          ar.push({value: "NEXT_N_DAYS:n", title: "For the number n provided, starts 12:00:00 of the current day and continues for the next n days.", suffix: " "});
          ar.push({value: "NEXT_N_WEEKS:n", title: "For the number n provided, starts 12:00:00 of the first day of the next week and continues for the next n weeks.", suffix: " "});
          ar.push({value: "LAST_N_WEEKS:n", title: "For the number n provided, starts 12:00:00 of the last day of the previous week and continues for the last n weeks.", suffix: " "});
          ar.push({value: "NEXT_N_MONTHS:n", title: "For the number n provided, starts 12:00:00 of the first day of the next month and continues for the next n months.", suffix: " "});
          ar.push({value: "LAST_N_MONTHS:n", title: "For the number n provided, starts 12:00:00 of the last day of the previous month and continues for the last n months.", suffix: " "});
          ar.push({value: "THIS_QUARTER", title: "Starts 12:00:00 of the current quarter and continues to the end of the current quarter.", suffix: " "});
          ar.push({value: "LAST_QUARTER", title: "Starts 12:00:00 of the previous quarter and continues to the end of that quarter.", suffix: " "});
          ar.push({value: "NEXT_QUARTER", title: "Starts 12:00:00 of the next quarter and continues to the end of that quarter.", suffix: " "});
          ar.push({value: "NEXT_N_QUARTERS:n", title: "Starts 12:00:00 of the next quarter and continues to the end of the nth quarter.", suffix: " "});
          ar.push({value: "LAST_N_QUARTERS:n", title: "Starts 12:00:00 of the previous quarter and continues to the end of the previous nth quarter.", suffix: " "});
          ar.push({value: "THIS_YEAR", title: "Starts 12:00:00 on January 1 of the current year and continues through the end of December 31 of the current year.", suffix: " "});
          ar.push({value: "LAST_YEAR", title: "Starts 12:00:00 on January 1 of the previous year and continues through the end of December 31 of that year.", suffix: " "});
          ar.push({value: "NEXT_YEAR", title: "Starts 12:00:00 on January 1 of the following year and continues through the end of December 31 of that year.", suffix: " "});
          ar.push({value: "NEXT_N_YEARS:n", title: "Starts 12:00:00 on January 1 of the following year and continues through the end of December 31 of the nth year.", suffix: " "});
          ar.push({value: "LAST_N_YEARS:n", title: "Starts 12:00:00 on January 1 of the previous year and continues through the end of December 31 of the previous nth year.", suffix: " "});
          ar.push({value: "THIS_FISCAL_QUARTER", title: "Starts 12:00:00 on the first day of the current fiscal quarter and continues through the end of the last day of the fiscal quarter. The fiscal year is defined in the company profile under Setup at Company Profile | Fiscal Year.", suffix: " "});
          ar.push({value: "LAST_FISCAL_QUARTER", title: "Starts 12:00:00 on the first day of the last fiscal quarter and continues through the end of the last day of that fiscal quarter. The fiscal year is defined in the company profile under Setup at Company Profile | Fiscal Year.", suffix: " "});
          ar.push({value: "NEXT_FISCAL_QUARTER", title: "Starts 12:00:00 on the first day of the next fiscal quarter and continues through the end of the last day of that fiscal quarter. The fiscal year is defined in the company profile under Setup at Company Profile | Fiscal Year.", suffix: " "});
          ar.push({value: "NEXT_N_FISCAL_QUARTERS:n", title: "Starts 12:00:00 on the first day of the next fiscal quarter and continues through the end of the last day of the nth fiscal quarter. The fiscal year is defined in the company profile under Setup atCompany Profile | Fiscal Year.", suffix: " "});
          ar.push({value: "LAST_N_FISCAL_QUARTERS:n", title: "Starts 12:00:00 on the first day of the last fiscal quarter and continues through the end of the last day of the previous nth fiscal quarter. The fiscal year is defined in the company profile under Setup at Company Profile | Fiscal Year.", suffix: " "});
          ar.push({value: "THIS_FISCAL_YEAR", title: "Starts 12:00:00 on the first day of the current fiscal year and continues through the end of the last day of the fiscal year. The fiscal year is defined in the company profile under Setup at Company Profile | Fiscal Year.", suffix: " "});
          ar.push({value: "LAST_FISCAL_YEAR", title: "Starts 12:00:00 on the first day of the last fiscal year and continues through the end of the last day of that fiscal year. The fiscal year is defined in the company profile under Setup at Company Profile | Fiscal Year.", suffix: " "});
          ar.push({value: "NEXT_FISCAL_YEAR", title: "Starts 12:00:00 on the first day of the next fiscal year and continues through the end of the last day of that fiscal year. The fiscal year is defined in the company profile under Setup at Company Profile | Fiscal Year.", suffix: " "});
          ar.push({value: "NEXT_N_FISCAL_YEARS:n", title: "Starts 12:00:00 on the first day of the next fiscal year and continues through the end of the last day of the nth fiscal year. The fiscal year is defined in the company profile under Setup at Company Profile | Fiscal Year.", suffix: " "});
          ar.push({value: "LAST_N_FISCAL_YEARS:n", title: "Starts 12:00:00 on the first day of the last fiscal year and continues through the end of the last day of the previous nth fiscal year. The fiscal year is defined in the company profile under Setup at Company Profile | Fiscal Year.", suffix: " "});
        }
        if (field.nillable) {
          ar.push({value: "null", title: "null", suffix: " "});
        }
      });
      ar = ar.filter(function(res) { return res.value.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1 || res.title.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1; });
      vm.autocompleteTitle(fieldNames + (ar.length == 0 ? " values (Press Ctrl+Space):" : " values:"));
      vm.autocompleteResults(ar);
      return;
    } else {
      // Autocomplete field names and functions
      if (ctrlSpace) {
        var ar = [];
        contextSobjectDescribes.forEach(function(sobjectDescribe) {
          sobjectDescribe.fields
            .filter(function(field) { return field.name.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1 || field.label.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1; })
            .forEach(function(field) {
              ar.push(contextPath + field.name);
            });
        });
        if (ar.length > 0) {
          queryInput.insertText(ar.join(", ") + (isBeforeFrom ? " " : ", "), selStart - contextPath.length, selEnd);
        }
        queryAutocompleteHandler();
        return;
      }
      var ar = [];
      contextSobjectDescribes.forEach(function(sobjectDescribe) {
        sobjectDescribe.fields
          .filter(function(field) { return field.name.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1 || field.label.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1; })
          .forEach(function(field) {
            ar.push({value: field.name, title: field.label, suffix: isBeforeFrom ? " " : ", "});
            if (field.relationshipName) {
              ar.push({value: field.relationshipName + ".", title: field.label, suffix: ""});
            }
          });
      });
      ["AVG", "COUNT", "COUNT_DISTINCT", "MIN", "MAX", "SUM", "CALENDAR_MONTH", "CALENDAR_QUARTER", "CALENDAR_YEAR", "DAY_IN_MONTH", "DAY_IN_WEEK", "DAY_IN_YEAR", "DAY_ONLY", "FISCAL_MONTH", "FISCAL_QUARTER", "FISCAL_YEAR", "HOUR_IN_DAY", "WEEK_IN_MONTH", "WEEK_IN_YEAR", "convertTimezone"]
        .filter(function (fn) { return fn.toLowerCase().indexOf(searchTerm.toLowerCase()) == 0; })
        .forEach(function(fn) {
          ar.push({value: fn, title: fn + "()", suffix: "("});
        });
      vm.autocompleteTitle(contextSobjectDescribes.map(function(sobjectDescribe) { return sobjectDescribe.name; }).join(", ") + " fields:");
      vm.autocompleteResults(ar);
      return;
    }
  }

  function computeExportResultVm() {
    if (exportResult().exportStatus != null) {
      return {
        isWorking: exportResult().isWorking,
        resultText: exportResult().exportStatus
      };
    }
    var expRecords = exportResult().exportedRecords;
    var exportAsJson = vm.dataFormat() == "json";
    if (exportAsJson) {
      return {
        isWorking: exportResult().isWorking,
        resultText: JSON.stringify(expRecords, null, "  ")
      };
    }
    /*
    Discover what columns should be in our CSV file.
    We don't want to build our own SOQL parser, so we discover the columns based on the data returned.
    This means that we cannot find the columns of cross-object relationships, when the relationship field is null for all returned records.
    We don't care, because we don't need a stable set of columns for our use case.
    */
    var header = [];
    for (var i = 0; i < expRecords.length; i++) {
      var record = expRecords[i];
      function discoverColumns(record, prefix) {
        for (var field in record) {
          if (field == "attributes") {
            continue;
          }
          var column = prefix + field;
          if (header.indexOf(column) < 0) {
            header.push(column);
          }
          if (typeof record[field] == "object" && record[field] != null) {
            discoverColumns(record[field], column + ".");
          }
        }
      }
      discoverColumns(record, "");
    }
    /*
    Now we have the columns, we add the records to the CSV table.
    */
    var table = [];
    for (var i = 0; i < expRecords.length; i++) {
      var record = expRecords[i];
      var row = [];
      for (var c = 0; c < header.length; c++) {
        var column = header[c].split(".");
        var value = record;
        for (var f = 0; f < column.length; f++) {
          var field = column[f];
          if (typeof value != "object") {
            value = null;
          }
          if (value != null) {
            value = value[field];
          }
        }
        if (typeof value == "object" && value != null && value.attributes && value.attributes.type) {
          value = "[" + value.attributes.type + "]";
        }
        row.push(value);
      }
      table.push(row);
    }
    if (vm.dataFormat() == "table") {
      var data = [];
      for (var r = 0; r < table.length; r++) {
        data.push({
          cells: table[r],
          openAllData: function() { showAllData(this); }.bind({recordAttributes: expRecords[r].attributes, useToolingApi: exportResult().exportedTooling})
        });
      }
      return {
        isWorking: exportResult().isWorking,
        resultTable: {header: header, data: data}
      };
    } else {
      var separator = vm.dataFormat() == "excel" ? "\t" : ",";
      return {
        isWorking: exportResult().isWorking,
        resultText: csvSerialize([header].concat(table), separator)
      };
    }
  }

  vm.queryTooling.subscribe(function() {
    queryAutocompleteHandler();
  });

  function getQueryHistory() {
    var queryHistory;
    try {
      queryHistory = JSON.parse(queryHistoryStorage.get());
    } catch(e) {}
    if (!Array.isArray(queryHistory)) {
      queryHistory = [];
    }
    return queryHistory;
  }

  function addToQueryHistory(query) {
    var queryHistory = getQueryHistory();
    var historyIndex = queryHistory.indexOf(query);
    if (historyIndex > -1) {
      queryHistory.splice(historyIndex, 1);
    }
    queryHistory.splice(0, 0, query);
    if (queryHistory.length > 20) {
      queryHistory.pop();
    }
    queryHistoryStorage.set(JSON.stringify(queryHistory));
    return queryHistory;
  }

  function clearQueryHistory() {
    queryHistoryStorage.clear();
  }

  var exportProgress = {};
  function doExport() {
    var exportedTooling = vm.queryTooling();
    var exportedRecords = [];
    exportResult({
      isWorking: true,
      exportStatus: "Exporting...",
      exportedRecords: exportedRecords,
      exportedTooling: exportedTooling
    });
    var query = queryInput.getValue();
    var queryMethod = exportedTooling ? "tooling/query" : vm.queryAll() ? "queryAll" : "query";
    spinFor(askSalesforce("/services/data/v33.0/" + queryMethod + "/?q=" + encodeURIComponent(query), exportProgress).then(function queryHandler(data) {
      exportedRecords = exportedRecords.concat(data.records);
      if (!data.done) {
        exportResult({
          isWorking: true,
          exportStatus: "Exporting... Completed " + exportedRecords.length + " of " + data.totalSize + " records.",
          exportedRecords: exportedRecords,
          exportedTooling: exportedTooling
        });
        return askSalesforce(data.nextRecordsUrl, exportProgress).then(queryHandler);
      }
      vm.queryHistory(addToQueryHistory(query));
      if (exportedRecords.length == 0) {
        exportResult({
          isWorking: false,
          exportStatus: data.totalSize > 0 ? "No data exported. " + data.totalSize + " record(s)." : "No data exported.",
          exportedRecords: exportedRecords,
          exportedTooling: exportedTooling
        });
        return null;
      }
      exportResult({
        isWorking: false,
        exportStatus: null,
        exportedRecords: exportedRecords,
        exportedTooling: exportedTooling
      });
      return null;
    }, function(xhr) {
      if (!xhr || xhr.readyState != 4) {
        throw xhr; // Not an HTTP error response
      }
      var data = JSON.parse(xhr.responseText);
      var text = "=== ERROR ===\n";
      for (var i = 0; i < data.length; i++) {
        text += data[i].message + "\n";
      }
      exportResult({
        isWorking: false,
        exportStatus: text,
        exportedRecords: exportedRecords,
        exportedTooling: exportedTooling
      });
      return null;
    }).then(null, function(error) {
      console.error(error);
      exportResult({
        isWorking: false,
        exportStatus: "UNEXPECTED EXCEPTION:" + error,
        exportedRecords: exportedRecords,
        exportedTooling: exportedTooling
      });
    }));
  }

  function stopExport() {
    exportProgress.abort({records: [], done: true, totalSize: 0});
  }

  function csvSerialize(table, separator) {
    return table.map(function(row) { return row.map(function(text) { return "\"" + ("" + (text == null ? "" : text)).split("\"").join("\"\"") + "\""; }).join(separator); }).join("\r\n");
  }

  return vm;
}