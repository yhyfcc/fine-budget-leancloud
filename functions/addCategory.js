const AV = require('leanengine');



AV.Cloud.define('addCategory',async function(request){
    if (!request.currentUser) {
        throw new AV.Cloud.Error('Please login') 
    }
    
    if (!request.params || !request.params.icon || !request.params.name || !request.params.io || (request.params.io !== 'expense' && request.params.io !== 'income')) {
        throw new AV.Cloud.Error('Invalid parameters');
    }

    if( request.params.io === 'expense' && (!request.params.limits || !request.params.limits  || typeof request.params.limits.max !== 'number')){
        throw new AV.Cloud.Error('Invalid parameters');
    }

    
    const category = AV.Object.extend('Category');
    const newCategory = new category();
    const params = request.params;
    let acl = new AV.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setReadAccess(request.currentUser, true);
    acl.setWriteAccess(request.currentUser, true);
    newCategory.set('icon', params.icon);
    newCategory.set('name', params.name);
    newCategory.set('user', request.currentUser);
    newCategory.set('type', 'category');
    newCategory.set('io', params.io);
    newCategory.set('limits', params.limits);
    newCategory.setACL(acl);
    return newCategory.save();
});