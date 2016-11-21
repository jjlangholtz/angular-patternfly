/**
 * @ngdoc directive
 * @name patternfly.views.directive:pfTableView
 *
 * @description
 *   Directive for rendering a table view.
 *   Pass a customScope object containing any scope variables/functions you need to access from the transcluded source, access these
 *   via 'customScope' in your transcluded hmtl.
 *   <br><br>
 *
 * @param {array} items Array of items to display in the table view.
 * @param {array} col-headers Array of column headers to display in the table's header row
 * @example
<example module="patternfly.jquery">
  <file name="index.html">
    <style>
      .list-view-container {
        border: none;
        padding: 10px;
      }
    </style>
    <div ng-controller="ViewCtrl" class="row example-container">
      <div class="col-md-12 list-view-container table-view-container">
        <div table-view-container">
          <div pf-table-view id="exampleTableView"
                            config="config"
                            dt-options="dtOptions"
                            colummns="colummns"
                            items="items"
                            action-buttons="actionButtons"
                            menu-actions="menuActions">
          </div>
        </div>
        <div class="col-md-12">
          <form role="form">
            <div class="form-group">
              <label class="checkbox-inline">
                <input type="checkbox" ng-model="usePagination" ng-change="togglePagination()">Use Pagination</input>
              </label>
              <label>
                <input ng-model="dtOptions.displayLength" ng-disabled="!usePagination" style="width: 24px; padding-left: 6px;"> # Rows Per Page</input>
              </label>
           </div>
         </form>
        </div>
        <div class="col-md-12">
          <label style="font-weight:normal;vertical-align:center;">Events: </label>
        </div>
        <div class="col-md-12">
          <textarea rows="10" class="col-md-12">{{eventText}}</textarea>
        </div>
      </div>
    </div>
  </file>

  <file name="script.js">
 angular.module('patternfly.jquery').controller('ViewCtrl', ['$scope',
      function ($scope) {
        $scope.dtOptions = {
          paginationType: 'full',
          order: [[2, "asc"]],
          dom: "t"
        };

        $scope.usePagination = false;
        $scope.togglePagination = function () {
          if($scope.usePagination) {
            $scope.dtOptions.displayLength = 3;
            $scope.dtOptions.dom = "tp";
          } else {
            $scope.dtOptions.displayLength = undefined;
            $scope.dtOptions.dom = "t";
          }
        };

        $scope.colummns = [
          { colHeader: "Name", colItemFld: "name" },
          { colHeader: "Address", colItemFld: "address"},
          { colHeader: "City", colItemFld: "city" },
          { colHeader: "State", colItemFld: "state"}
        ];

        $scope.items = [
          {
            name: "Fred Flintstone",
            address: "20 Dinosaur Way",
            city: "Bedrock",
            state: "Washingstone"
          },
          {
            name: "John Smith",
            address: "415 East Main Street",
            city: "Norfolk",
            state: "Virginia",
          },
          {
            name: "Frank Livingston",
            address: "234 Elm Street",
            city: "Pittsburgh",
            state: "Pennsylvania"
          },
          {
            name: "Linda McGovern",
            address: "22 Oak Street",
            city: "Denver",
            state: "Colorado"
          },
          {
            name: "Jim Brown",
            address: "72 Bourbon Way",
            city: "Nashville",
            state: "Tennessee"
          },
          {
            name: "Holly Nichols",
            address: "21 Jump Street",
            city: "Hollywood",
            state: "California"
          },
          {
            name: "Marie Edwards",
            address: "17 Cross Street",
            city: "Boston",
            state: "Massachusetts"
          },
          {
            name: "Pat Thomas",
            address: "50 Second Street",
            city: "New York",
            state: "New York"
          },
        ];

        $scope.eventText = "";

        $scope.config = {
          onCheckBoxChange: handleCheckBoxChange
        };

        function handleCheckBoxChange (item) {
          $scope.eventText = item.name + ' checked: ' + item.selected + '\r\n' + $scope.eventText;
        };

        var performAction = function (action, item) {
          $scope.eventText = item.name + " : " + action.name + "\r\n" + $scope.eventText;
        };

        $scope.actionButtons = [
          {
            name: 'Action',
            title: 'Perform an action',
            actionFn: performAction
          }
        ];

        $scope.menuActions = [
          {
            name: 'Action',
            title: 'Perform an action',
            actionFn: performAction
          },
          {
            name: 'Another Action',
            title: 'Do something else',
            actionFn: performAction
          },
          {
            name: 'Disabled Action',
            title: 'Unavailable action',
            actionFn: performAction,
            isDisabled: true
          },
          {
            name: 'Something Else',
            title: '',
            actionFn: performAction
          },
          {
            isSeparator: true
          },
          {
            name: 'Grouped Action 1',
            title: 'Do something',
            actionFn: performAction
          },
          {
            name: 'Grouped Action 2',
            title: 'Do something similar',
            actionFn: performAction
          }
        ];
      }
    ]);
  </file>
</example>
 */
angular.module('patternfly.jquery').directive('pfTableView', function (DTOptionsBuilder, DTColumnDefBuilder, pfUtils, $timeout, $log) {
  'use strict';
  return {
    restrict: 'A',
    scope: {
      config: '=?',
      dtOptions: '=?',
      colummns: '=',
      items: '=',
      actionButtons: '=?',
      menuActions: '=?'
    },
    controllerAs: 'vm',
    bindToController: true,
    templateUrl: 'views/tableview/table-view.html',
    controller: function (DTOptionsBuilder, DTColumnDefBuilder, $scope, $element, pfUtils, $log, $filter) {
      var vm = this;
      var i = 0, actnBtns = 0;
      var item, prop;

      vm.selectAll = false;
      vm.dtInstance = {};

      vm.defaultDtOptions = {
        order: [[1, "asc"]],
        dom: "t",
        select: {
          selector: 'td:first-child input[type="checkbox"]',
          style: 'multi'
        }
      };

      vm.dtOptions = pfUtils.merge(vm.defaultDtOptions, vm.dtOptions);

      // add checkbox col, not sortable
      vm.dtColumnDefs = [ DTColumnDefBuilder.newColumnDef(0).notSortable() ];
      // add column def. for each property of an item
      item = vm.items[0];
      for (prop in item) {
        if (item.hasOwnProperty(prop)) {   //need this 'if' for eslint
          vm.dtColumnDefs.push(DTColumnDefBuilder.newColumnDef(i));
          i++;
        }
      }
      // add actions col.
      if (vm.actionButtons && vm.actionButtons.length > 0) {
        for (actnBtns = 1; actnBtns <= vm.actionButtons.length; actnBtns++) {
          i += 1;
          vm.dtColumnDefs.push(DTColumnDefBuilder.newColumnDef(i).notSortable());
        }
      }
      if (vm.menuActions && vm.menuActions.length > 0) {
        i += 1;
        vm.dtColumnDefs.push(DTColumnDefBuilder.newColumnDef(i).notSortable());
      }

      vm.dtInstanceCallback = function (_dtInstance) {
        var oTable, rows;
        vm.dtInstance = _dtInstance;
        listenForDraw();
        selectRowsByChecked();
      };

      /*
       *   Checkbox Selections
       */

      vm.toggleAll = function () {
        angular.forEach(vm.items, function (item) {
          if (item.selected !== vm.selectAll) {
            item.selected = vm.selectAll;
            if (vm.config && vm.config.onCheckBoxChange) {
              vm.config.onCheckBoxChange(item);
            }
          }
        });
        $timeout(function () {
          selectRowsByChecked();
        });
      };

      vm.toggleOne = function (item) {
        if (vm.config && vm.config.onCheckBoxChange) {
          vm.config.onCheckBoxChange(item);
        }
        $timeout(function () {
          setSelectAllCheckbox();
        });
      };

      /*
       *   Action Buttons and Menus
       */

      vm.handleButtonAction = function (action, item) {
        if (action && action.actionFn) {
          action.actionFn(action, item);
        }
      };

      vm.isColItemFld = function (key) {
        var retVal = false;
        var tableCol = $filter('filter')(vm.colummns, {colItemFld: key});

        if (tableCol && tableCol.length === 1) {
          retVal = true;
        }

        return retVal;
      };

      vm.areActions = function () {
        return (vm.actionButtons && vm.actionButtons.length > 0) ||
               (vm.menuActions && vm.menuActions.length > 0);
      };

      vm.calcActionsColspan = function () {
        var colspan = 0;

        if (vm.actionButtons && vm.actionButtons.length > 0) {
          colspan += vm.actionButtons.length;
        }

        if (vm.menuActions && vm.menuActions.length > 0) {
          colspan += 1;
        }

        return colspan;
      };

      vm.handleMenuAction = function (action, item) {
        if (!vm.checkDisabled(item) && action && action.actionFn && (action.isDisabled !== true)) {
          action.actionFn(action, item);
        }
      };

      vm.setupActions = function (item, event) {
        /* Ignore disabled items completely
        if (vm.checkDisabled(item)) {
          return;
        }*/

        // update the actions based on the current item
        // $scope.updateActions(item);

        $timeout(function () {
          var parentDiv = undefined;
          var nextElement;

          nextElement = event.target;
          while (nextElement && !parentDiv) {
            if (nextElement.className.indexOf('dropdown-kebab-pf') !== -1) {
              parentDiv = nextElement;
              if (nextElement.className.indexOf('open') !== -1) {
                setDropMenuLocation (parentDiv);
              }
            }
            nextElement = nextElement.parentElement;
          }
        });
      };

      vm.checkDisabled = function (item) {
        return false;
      };

      function setDropMenuLocation (parentDiv) {
        var dropButton = parentDiv.querySelector('.dropdown-toggle');
        var dropMenu =  parentDiv.querySelector('.dropdown-menu');
        var parentRect = $element[0].getBoundingClientRect();
        var buttonRect = dropButton.getBoundingClientRect();
        var menuRect = dropMenu.getBoundingClientRect();
        var menuTop = buttonRect.top - menuRect.height;
        var menuBottom = buttonRect.top + buttonRect.height + menuRect.height;

        if ((menuBottom <= parentRect.top + parentRect.height) || (menuTop < parentRect.top)) {
          vm.dropdownClass = 'dropdown';
        } else {
          vm.dropdownClass = 'dropup';
        }
      }

      function listenForDraw () {
        var oTable;
        var dtInstance = vm.dtInstance;
        if (dtInstance && dtInstance.dataTable) {
          oTable = dtInstance.dataTable;
          oTable.on('draw.dt', function () {
            $timeout(function () {
              selectRowsByChecked();
            });
          });
        }
      }

      function selectRowsByChecked () {
        var oTable, rows, checked;
        oTable = vm.dtInstance.DataTable;

        // deselect all
        rows = oTable.rows();
        rows.deselect();

        // select those with checked checkboxes
        rows = oTable.rows( function ( idx, data, node ) {
          //         row      td     input type=checkbox
          checked = node.children[0].children[0].checked;
          //$log.info('testing row: ' + idx + ', checked: ' + checked);
          return checked;
        });
        //$log.info('# Rows Selected: ' + rows[0].length);
        rows.select();

        setSelectAllCheckbox();
      }

      function setSelectAllCheckbox () {
        var oTable, rows, checked, numAllRows, numCheckedRows;
        oTable = vm.dtInstance.DataTable;

        // get num of all rows
        rows = oTable.rows();
        numAllRows = rows[0].length;

        // get rows with checked checkboxes
        rows = oTable.rows( function ( idx, data, node ) {
          //         row      td     input type=checkbox
          checked = node.children[0].children[0].checked;
          //$log.info('testing row: ' + idx + ', checked: ' + checked);
          return checked;
        });
        numCheckedRows = rows[0].length;

        // set selectAll checkbox
        vm.selectAll = numAllRows === numCheckedRows ? true : false;
      }
    },
    link: function (scope, element, attrs) {
    }
  };
}).filter('toArray', function () {
  'use strict';
  return function (obj, addKey) {
    /*eslint-disable */
    if (!angular.isObject(obj)) {
      return obj;
    }
    if ( addKey === false ) {
      return Object.keys(obj).map(function (key) {
        return obj[key];
      });
    } else {
      return Object.keys(obj).map(function (key) {
        var value = obj[key];
        return angular.isObject(value) ?
          Object.defineProperty(value, '$key', { enumerable: false, value: key}) :
        { $key: key, $value: value };
      });
    }
    /*eslint-enable */
  };
});
