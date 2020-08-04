const AV = require('leanengine');

AV.Cloud.define('addSubcategory',async function(request){
    if (!request.currentUser) {
        throw new AV.Cloud.Error('Please login')
    }
    
    if (!request.params || !request.params.icon || !request.params.name || !request.params.parent || !request.params.io || (request.params.io !== 'expense' && request.params.io !== 'income')) {
        throw new AV.Cloud.Error('Invalid parameters');
    }

    if( request.params.io === 'expense' && (!request.params.limits || !request.params.limits  || typeof request.params.limits.max !== 'number')){
        throw new AV.Cloud.Error('Invalid parameters');
    }

    const query = new AV.Query('Category');

    let parentCategory;
    try {
        parentCategory = await query.include('user').get(request.params.parent);
    }catch(err){
        throw new AV.Cloud.Error('Category not exist');
    }

    if (!parentCategory) {
        throw new AV.Cloud.Error('Category not exist');
    }
    if (parentCategory.toJSON().type === 'subcategory') {
        throw new AV.Cloud.Error('Only 2-level category allowed');
    }
    
    userId = parentCategory.toJSON().user.objectId;
    if (userId !== request.currentUser.toJSON().objectId) {
        console.log(userId, request.currentUser);
        throw new AV.Cloud.Error('No access');
    }
    
    const params = request.params;
    let newCategory = new AV.Object('Category');
    newCategory.set('icon', params.icon);
    newCategory.set('name', params.name);
    newCategory.set('user', request.currentUser);
    newCategory.set('type', 'subcategory');
    newCategory.set('io', params.io);
    newCategory.set('limits', params.limits);
    newCategory.set('parent', { __type: 'Pointer', className: 'Category', objectId: request.params.parent });
    let acl = new AV.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setReadAccess(request.currentUser,true);
    acl.setWriteAccess(request.currentUser,true);
    newCategory.setACL(acl);
    newCategory = await newCategory.save();
    
    parentCategory.addUnique('subcategories', {__type: 'Pointer',className: 'Category', objectId: newCategory.toJSON().objectId})
    
    await parentCategory.save();
    return newCategory;
})
