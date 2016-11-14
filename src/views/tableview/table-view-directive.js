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
    <div ng-controller="ViewCtrl" class="row example-container">
      <div class="col-md-12 list-view-container">
        <div pf-table-view class="example-list-view" id="exampleTableView"
                          col-headers="colHeaders"
                          items="items">
        </div>
      </div>
    </div>
  </file>

  <file name="script.js">
 angular.module('patternfly.jquery').controller('ViewCtrl', ['$scope',
      function ($scope) {
        $scope.colHeaders = [
          { title: "Name" },
          { title: "Address" },
          { title: "City" },
          { title: "State" },
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
      }
    ]);
  </file>
</example>
 */
angular.module('patternfly.jquery').directive('pfTableView', function (DTOptionsBuilder, $timeout, $log) {
  'use strict';
  return {
    restrict: 'A',
    transclude: true,
    scope: {
      items: '=',
      colHeaders: '='
    },
    templateUrl: 'views/tableview/table-view.html',
    controller: function (DTOptionsBuilder, $scope, $element) {
      $scope.dtOptions = DTOptionsBuilder.newOptions().withDOM('t');
    },
    link: function (scope, element, attrs) {
    }
  };
});
