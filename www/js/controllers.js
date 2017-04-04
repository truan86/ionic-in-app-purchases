angular.module('starter.controllers', [])

  .controller('DashCtrl', function ($scope, $ionicPlatform, $timeout, dashModel, price) {

    $scope.modules = dashModel.getAvailableProducts();

    $ionicPlatform.ready(function () {
      $scope.buy = function (module) {
        price.proceedToPayment(module).then(function () {
          // unlock module
        });
      };
      price.storeInit().then(function () {
        price.getPrices(dashModel.getAvailableProducts()).then(function (availableProduct) {
          price.addPricesToModule(availableProduct, dashModel.getAvailableProducts());
          $scope.modules = price.modulesWithPrice;
        });
      });
    })
  });
