const AV = require('leanengine');

AV.Cloud.define('getCategoryList',async function(request){


    if(!request.currentUser){
        throw new AV.Cloud.Error('Please login');
    }

    let query = new AV.Query('Category');
    query.equalTo('user',request.currentUser);
    query.ascending('createdAt');
    query.ascending('type');

    let rawResult = (await query.find());

    let result = [];
    rawResult.forEach(curr => result.push(curr.toJSON()));

    let categroyGroupByMainCategory = [];
    result = Array.from(result);


    console.log(result);

    result.forEach(category => {
        if(category.type === 'subcategory'){
            return
        }

        let mainCategoryEntry = {
            ...category,
            subcategories: []
        }

        if(category.subcategories && category.subcategories.length > 0){
            category.subcategories.forEach(subcategory => {
                mainCategoryEntry.subcategories.push(result.find(category => category.objectId === subcategory.objectId));
            })
        }

        categroyGroupByMainCategory.push(mainCategoryEntry);
    })

    return categroyGroupByMainCategory;
})