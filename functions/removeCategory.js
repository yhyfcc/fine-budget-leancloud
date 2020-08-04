const AV = require('leanengine');

AV.Cloud.define('removeCategory',async function(request){
    let body = request.params;

    if (!body.category) {
        throw new AV.Cloud.Error('Invalid parameters');
    }
    
    let target;
    try{
        target = await(new AV.Query('Category')).get(body.category);
    }catch(err){
        throw new AV.Cloud.Error('Category not exist');
    }
    
    if (!target) {
        throw new AV.Cloud.Error('Category not exist');
    }

    if(request.currentUser.toJSON().objectId !== target.get('user').toJSON().objectId){
        throw new AV.Cloud.Error('No access');
    }

    if(target.get('type') === 'category'){
        if(target.get('subcategories') && target.get('subcategories').length > 0){
            throw new AV.Cloud.Error('Category still has subcategories');
        }
    }
    
    let [relatedGoals, relatedRecords]= await Promise.all([(new AV.Query('Goals')).equalTo('category', target).find(),(new AV.Query('Records')).equalTo('category', target).find()]);
    
    let relatedStat = await (new AV.Query('Statistics')).equalTo('category',target).find();

    let operations = [];

    let parentCategory = target.get('parent');
    if(parentCategory){
         parentCategory.remove('subcategories',{__type: "Pointer", className: 'Category', objectId: body.category});
         operations.push(parentCategory.save());
    }

    operations.push(AV.Object.destroyAll(relatedGoals));
    relatedRecords.forEach(record => record.unset('category'));
    operations.push(AV.Object.destroyAll(relatedRecords));
    operations.push(AV.Object.destroyAll(relatedStat));
    operations.push(target.destroy());
    await Promise.all(operations);
    
    return {
        msg: "success"
    };
})
