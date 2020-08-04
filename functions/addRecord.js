const AV = require('leanengine')

const changeStat = async (_user,_type,_date,_amount,ioType,isForCategory,_category,updateArray) => {

    //date is a ISO date string 
    let date = new Date(_date);
    date.setHours(0, 0, 0);
    if(_type === 'month'){
        date.setUTCDate(1);
    }else if(_type === 'year'){
        date.setMonth(0);
        date.setDate(1);
    }else{
        // its type is day,nothing needs to be further changed
    }
    console.log(date);
    let query = new AV.Query('Statistics');
    // MAY BE AN ERROR, 'user' is a pointer, _user is an user object.
    query.equalTo('user', _user);
    query.equalTo('type', _type);
    query.equalTo('io',ioType);
    query.equalTo('forCategory', isForCategory);
    query.equalTo('date', { __type: 'Date', iso: date.toISOString() })
    if(isForCategory){
        query.equalTo('category', { __type: 'Pointer', className: 'Category', objectId: _category });
    }

    let result = await query.find();
    console.log('length of result ',result.length);
    console.log('Same ' + _type + (isForCategory ? ' with' : ' no') + ' category');
    let updatedObject;
    if (result.length === 0) {
        let newStatistics = new AV.Object('Statistics');
        newStatistics.set('date', { __type: 'Date', iso: date.toISOString() });
        // MAY BE AN ERROR, 'user' should be a pointer, _user is an user object.
        newStatistics.set('user', _user);
        newStatistics.set('value', _amount);
        newStatistics.set('type', _type);
        newStatistics.set('io', ioType);
        newStatistics.set('forCategory', isForCategory);
        let acl = new AV.ACL();
        acl.setPublicReadAccess(false);
        acl.setPublicWriteAccess(false);
        acl.setReadAccess(_user,true);
        acl.setWriteAccess(_user,true);
        newStatistics.setACL(acl);
        if(isForCategory){
            newStatistics.set('category', { __type: 'Pointer', className: 'Category', objectId: _category });
        }
        updatedObject = newStatistics ;
    }else{
        result[0].increment('value', _amount);
        updatedObject = result[0];
    }

    updateArray.push(updatedObject);
}


AV.Cloud.define('addRecord', async function (request){
    let body = request.params;
    
    if(!request.currentUser){
        request.currentUser = body.currentUser;
    }
    

    console.log(body);

    if (!body.category || !body.date || !body.amount || !body.description) {
        throw new AV.Cloud.Error('Invalid parameters ad');
    }


    let targetCategory;
    try{
        targetCategory =  await (new AV.Query('Category')).get(body.category);
    }catch(err){
        throw new AV.Cloud.Error('Category not exist');
    }

    if(!targetCategory){
        throw new AV.Cloud.Error('Category not exist');
    }

    if(targetCategory.get('type') !== 'subcategory'){
        throw new AV.Cloud.Error('Only addition to subcategory allowed');
    }

    if(request.currentUser.toJSON().objectId !== targetCategory.get('user').toJSON().objectId){
        throw new AV.Cloud.Error('No access');
    }

    let categoryIoType = targetCategory.get('io');

    let newRecord = new AV.Object('Records');



    newRecord.set('user', request.currentUser);
    newRecord.set('category', { __type: 'Pointer', className: 'Category', objectId: body.category });
    newRecord.set('amount', body.amount);
    newRecord.set('description', body.description);
    newRecord.set('date', { __type: 'Date', iso: body.date });

    let acl = new AV.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setWriteAccess(request.currentUser, true);
    acl.setReadAccess(request.currentUser, true);
    newRecord.setACL(acl);

    let resultToReturn = newRecord.save();

    let sideEffects = [];

    console.log('Here!');

    let fcnRuns = [];
    //Stat for each month, no category specified
    fcnRuns.push(changeStat(request.currentUser,'month',body.date,body.amount,categoryIoType,false,null,sideEffects));
    //Stat for each month, with category specified
    fcnRuns.push(changeStat(request.currentUser,'month',body.date,body.amount,categoryIoType,true,body.category,sideEffects));
    //Stat for each day, no category specified
    fcnRuns.push(changeStat(request.currentUser,'day',body.date,body.amount,categoryIoType,false,null,sideEffects));
    //Stat for each day, with category specified
    fcnRuns.push(changeStat(request.currentUser,'day',body.date,body.amount,categoryIoType,true,body.category,sideEffects));
    await Promise.all(fcnRuns);
    await AV.Object.saveAll(sideEffects);

    return resultToReturn;
});
