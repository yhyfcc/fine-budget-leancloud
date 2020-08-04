const AV = require('leanengine');

AV.Cloud.afterSave('_User',async function(request){
    request.object.set('displayCurrency','cny');
    request.object.set('baseCurrency','cny');
    request.object.set('monthLimit',1000);

    return request.object.save();
})