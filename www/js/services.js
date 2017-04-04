angular.module('starter.services', [])

  .factory('dashModel', function () {
    // Some fake testing data
    var modules = [
      {
        id: 0,
        name: 'product 1',
        description: 'Lorem ipsum dolor sit amet, no scripta habemus duo, qui augue clita omnes ei.',
        microsoftStoreId: 'microsoft_test11',
        googleMarketId: 'google_test_1',
        appleStoreId: 'apple_test_16'
      },
      {
        id: 1,
        name: 'product 2',
        description: 'Lorem ipsum dolor sit amet, no scripta habemus duo, qui augue clita omnes ei.',
        microsoftStoreId: 'microsoft_test13',
        googleMarketId: 'google_test_10',
        appleStoreId: 'apple_test_17'
      },
      {
        id: 2,
        name: 'product 3',
        description: 'Lorem ipsum dolor sit amet, no scripta habemus duo, qui augue clita omnes ei.',
        microsoftStoreId: 'microsoft_test14',
        googleMarketId: 'google_test_11',
        appleStoreId: 'apple_test_18'
      },
      {
        id: 3,
        name: 'product 4',
        description: 'Lorem ipsum dolor sit amet, no scripta habemus duo, qui augue clita omnes ei.',
        microsoftStoreId: 'microsoft_test15',
        googleMarketId: 'google_test_12',
        appleStoreId: 'apple_test_19'
      }
    ];

    return {
      getAvailableProducts: function () {
        return modules;
      }
    };
  })
  .factory('price', function ($q, $timeout) {
    var key = '';

    var price = {
      modulesWithPrice: [],
      storeInit: function () {
        return $q(function (resolve, reject) {
          if (window.store) {

            function success() {
              resolve();
            };

            function error() {
              reject();
            };

            if (ionic.Platform.isIOS()) {
              key = 'appleStoreId';
              storekit.init({}, function () {
                resolve();
              }, function () {
                reject();
              });

            } else if (ionic.Platform.isAndroid()) {
              key = 'googleMarketId';
              store.inappbilling.init(success, error);
            } else {
              key = 'microsoftStoreId';
              store.inappbilling.init(success, error);
            }
          }
        });
      },
      getPrices: function (products) {
        var deferred = $q.defer();

        console.info('Getting prices from store');
        if (!window.store) {
          deferred.reject();
          return deferred.promise;
        }
        var skus = price.getSKUS(products);

        if (!skus.length) {
          deferred.reject();
          return deferred.promise;
        }

        function successHandler(res) {
          console.info('successHandler', res);
          deferred.resolve(res);
        }

        function errorHandler(error) {
          console.info(error);
          deferred.reject();
        }

        if (key === 'appleStoreId') {
          var skusIOS = '';
          skus.forEach(function (sku) {
            skusIOS += sku + ',';
          });
          storekit.load(
            skusIOS,
            successHandler,
            errorHandler
          );
        } else if (key === 'googleMarketId') {
          store.inappbilling.getProductDetails(
            successHandler,
            errorHandler,
            skus
          );

        } else if (key === 'microsoftStoreId') {
          store.inappbilling.getProductDetails(
            successHandler,
            errorHandler,
            skus
          );
        }

        return deferred.promise;
      },
      getSKUS: function (products) {
        var skus = [];
        products.forEach(function (product) {
          skus.push(product[key]);
        });
        return skus;
      },
      addPricesToModule: function (products, modules) {
        var modulesWithPrice = [];
        modules.forEach(function (module) {
          products.forEach(function (product) {
            if (product.productId === module[key] || product.id === module[key]) {
              if (key === 'microsoftStoreId') {
                module.price = product.formattedPrice;
              } else {
                module.price = product.price;
              }
              modulesWithPrice.push(module);
            }
          })
        });
        price.modulesWithPrice = modulesWithPrice;
      },
      proceedToPayment: function (product) {
        store.register({
          id: product[key],
          type: store.NON_CONSUMABLE
        });
        // item_walker = store.get( product[key]);
        // console.log('item_walker',item_walker);

        var defer = $q.defer();
        store.refresh();

        // api.purchaseStart(product.id)
        //   .then(function (data) {

        store.order(product[key]);
        store.when(product[key])
          .approved(function (result) {
            console.log('result!!!!', result);
            if (key === 'appleStoreId' && result.transaction && result.transaction.appStoreReceipt
              || key === 'googleMarketId' && result.transaction && result.transaction.receipt
              || key === 'microsoftStoreId' && result.transaction && result.transaction.receipt) {

              var dataForConfirmPurchases = {
                appleStoreResponse: key === 'appleStoreId' ? JSON.stringify(result).replace(/\\/g, '') : '',
                googleMarketReceipt: key === 'googleMarketId' ? result.transaction.receipt.replace(/\\/g, '') : '',
                microsoftStoreReceipt: key === 'microsoftStoreId' ? btoa(result.transaction.receipt.replace(/\\/g, '')) : '',
                googleMarketSignature: key === 'googleMarketId' ? result.transaction.signature : ''
              };
              // api.purchaseFinish(product.id, data.modulePurchase.id, dataForconfirmPurchases)
              //   .then(function (data) {
              //     if (data.modulePurchase.valid) {
              //       defer.resolve();
              //     } else {
              //       defer.reject('Server error.');
              //     }
              //   })
              //   .catch(function (e) {
              //     defer.reject(langConfig.error.requestProblem);
              //   });
            }
          });
        store.when(product[key]).cancelled(function () {
          defer.reject();
        });
        store.when(product[key]).error(function () {
          defer.reject(langConfig.error.requestProblem);
        });
        store.when(product[key]) //product already purchased
          .owned(function (result) {
            console.log(result);
            if (key === 'appleStoreId' && result.transaction.appStoreReceipt || key === 'googleMarketId' && result.transaction && result.transaction.receipt || key === 'microsoftStoreId' && result.transaction && result.transaction.receipt) {
              var dataForConfirmPurchases = {
                appleStoreResponse: key === 'appleStoreId' ? JSON.stringify(result).replace(/\\/g, '') : '',
                googleMarketReceipt: key === 'googleMarketId' ? result.transaction.receipt.replace(/\\/g, '') : '',
                microsoftStoreReceipt: key === 'microsoftStoreId' ? btoa(result.transaction.receipt.replace(/\\/g, '')) : '',
                googleMarketSignature: key === 'googleMarketId' ? result.transaction.signature : ''
              };
              // api.purchaseFinish(product.id, data.modulePurchase.id, dataForConfirmPurchases)
              //   .then(function (data) {
              //     if (data.modulePurchase.valid) {
              //       defer.resolve();
              //     } else {
              //       defer.reject('Server error');
              //     }
              //   })
              //   .catch(function (e) {
              //     defer.reject(langConfig.error.requestProblem);
              //   });
            }
          });
        // })
        // .catch(function () {
        //   defer.reject(langConfig.error.requestProblem);
        // });
        return defer.promise;
      }
    };
    return price;
  });
