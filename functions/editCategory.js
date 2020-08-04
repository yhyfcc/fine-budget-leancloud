const AV = require('leanengine');

AV.Cloud.define('editCategory',async function(request){
    let body = request.params;

    if (!body.category) {
        throw new AV.Cloud.Error('Invalid parameters');
    }


    
    let target;
    try {
        target = await (new AV.Query('Category')).include('user').get(body.category);
    }catch(err){
        throw new AV.Cloud.Error('Category not exist');
    }
    
    if (!target) {
        throw new AV.Cloud.Error('Category not exist');
    }
    
    if(request.currentUser.toJSON().objectId !== target.get('user').toJSON().objectId){
        throw new AV.Cloud.Error('No access');
    }
    
    if (body.icon) {
        target.set('icon', body.icon);
    }
    if (body.name) {
        target.set('name', body.name);
    }
    if (body.limits) {
        target.set('limits', body.limits);
    }
    
    return target.save();
})
