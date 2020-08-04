const AV = require('leanengine');

AV.Cloud.define('addGoal',async function(request){
    let body = request.params;
    if (!body.type || !body.target || !body.description ) {
        throw new AV.Cloud.Error('Invalid parameters');
    }
    
    if (body.current && body.current >= body.target) {
        throw new AV.Cloud.Error('Invalid parameters');
    }
    
    let newGoal = new AV.Object('Goals');
    newGoal.set('user', request.currentUser);
    newGoal.set('type', body.type);
    newGoal.set('target', body.target);
    newGoal.set('current', body.current ? body.current : 0);
    newGoal.set('description', body.description);
    newGoal.set('fulfilled', false);

    if (body.category) {
        let category;
        try{
            category = await (new AV.Query('Category').get(body.category))
        }catch(err){
            throw new AV.Cloud.Error('Category not exist');
        }

        if(category.get('type') !== 'subcategory'){
            throw new AV.Cloud.Error('Only addition to subcategory allowed');
        }

        if (category.get('user').toJSON().objectId !== request.currentUser.toJSON().objectId) {
            throw new AV.Cloud.Error('No access');
        }

        newGoal.set('category', { __type: "Pointer", className: 'Category', objectId: body.category });
    } else {
        newGoal.set('category', undefined);
    }
    
    
    let acl = new AV.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setWriteAccess(request.currentUser, true);
    acl.setReadAccess(request.currentUser, true);
    newGoal.setACL(acl);
    
    return newGoal.save();
})
