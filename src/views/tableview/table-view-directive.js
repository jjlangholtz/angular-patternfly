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
      .dataTables_wrapper {
        border: none;
        margin: 0px;
        padding: 0px;
      }
     .table.dataTable, table.dataTable.no-footer {
        margin: 0px;
      }
    </style>
    <div ng-controller="ViewCtrl" class="row example-container">
      <div class="col-md-12 list-view-container">
        <div pf-table-view class="example-list-view" id="exampleTableView"
                          dt-options="dtOptions"
                          colummns="colummns"
                          items="items"
                          action-buttons="actionButtons">
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
          displayLength: 3,
          order: [[2, "asc"]],
          dom: "tp"
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

        var performAction = function (action, item) {
          $scope.eventText = item.name + " : " + action.name + "\r\n" + $scope.eventText;
        };

        var startServer = function (action, item) {
          $scope.eventText = item.name + " : " + action.name + "\r\n" + $scope.eventText;
          item.started = true;
        };

        $scope.actionButtons = [
          {
            name: 'Start',
            class: 'btn-primary',
            title: 'Start the server',
            actionFn: startServer
          },
          {
            name: 'Action 1',
            title: 'Perform an action',
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
      actionButtons: '=?'
    },
    controllerAs: 'vm',
    bindToController: true,
    templateUrl: 'views/tableview/table-view.html',
    controller: function (DTOptionsBuilder, DTColumnDefBuilder, $scope, pfUtils, $log, $filter) {
      var vm = this;
      var i = 0;
      var item, prop;

      vm.selectAll = false;
      vm.dtInstance = {};

      vm.defaultDtOptions = {
        dom: "t",
        select: {
          selector: 'td:first-child input[type="checkbox"]',
          style: 'multi'
        }
      };

      vm.dtOptions = pfUtils.merge(vm.defaultDtOptions, vm.dtOptions);

      // checkbox is not sortable
      vm.dtColumnDefs = [ DTColumnDefBuilder.newColumnDef(0).notSortable() ];
      // add column def. for each property of an item
      item = vm.items[0];
      for (prop in item) {
        if (item.hasOwnProperty(prop)) {   //need this 'if' for eslint
          vm.dtColumnDefs.push(DTColumnDefBuilder.newColumnDef(i));
          i++;
        }
      }
      // action butttons
      if (vm.actionButtons && vm.actionButtons.length > 0) {
        vm.dtColumnDefs.push(DTColumnDefBuilder.newColumnDef(i + 1).notSortable());
      }

      vm.dtInstanceCallback = function (_dtInstance) {
        var oTable, rows;
        vm.dtInstance = _dtInstance;
        listenForDraw();
        selectRowsByChecked();
      };

      vm.toggleAll = function () {
        angular.forEach(vm.items, function (item) {
          item.selected = vm.selectAll;
        });
        $timeout(function () {
          if (vm.config && vm.config.onCheckBoxChange) {
            vm.config.onCheckBoxChange();
          }
          selectRowsByChecked();
        });
      };

      vm.toggleOne = function (item) {
        $timeout(function () {
          if (vm.config && vm.config.onCheckBoxChange) {
            vm.config.onCheckBoxChange(item);
          }
          setSelectAllCheckbox();
        });
      };

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
