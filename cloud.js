const AV = require('leanengine')
const fs = require('fs')
const path = require('path')

/**
 * 加载 functions 目录下所有的云函数
 */
fs.readdirSync(path.join(__dirname, 'functions')).forEach( file => {
  require(path.join(__dirname, 'functions', file))
})

/**
 * 一个简单的云代码方法
 */
const changeStat = async (_user,_type,_date,_amount,ioType,isForCategory,_category,promiseArray) => {

    //date is a ISO date string 
    let date = new Date(_date);
    date.setUTCHours(0, 0, 0);
    if(_type === 'month'){
        date.setUTCDate(1);
    }else if(_type === 'year'){
        date.setMonth(0);
        date.setUTCDate(1);
    }else{
        // its type is day,nothing needs to be further changed
    }
    console.log(date);
    let query = new AV.Query('Statistics');
    query.equalTo('user', _user);
    query.equalTo('type', _type);
    query.equalTo('io',ioType);
    query.equalTo('forCategory', isForCategory);
    query.equalTo('date', { __type: 'Date', iso: date.toISOString() })
    if(isForCategory){
        query.equalTo('category', { __type: 'Pointer', className: 'Category', objectId: _category });
    }

    let result = await query.find();
    console.log('Same' + _type + isForCategory ? 'with' : 'no' + 'category', result);
    let savePromise;
    if (result.length === 0) {
        let newStatistics = new AV.Object('Statistics');
        newStatistics.set('date', { __type: 'Date', iso: date.toISOString() });
        newStatistics.set('user', _user);
        newStatistics.set('value', _amount);
        newStatistics.set('type', _type);
        newStatistics.set('io', ioType);
        newStatistics.set('forCategory', isForCategory);
        if(isForCategory){
            newStatistics.set('category', { __type: 'Pointer', className: 'Category', objectId: _category });
        }
        savePromise = newStatistics.save();
    }else{
        result[0].increment('value', _amount);
        savePromise = result[0].save();
    }

    promiseArray.push(savePromise);
}



AV.Cloud.define('addRecord', async function (request){
    let body = request.params;
    if (!body.category || !body.date || !body.amount || !body.description) {
        throw new AV.Cloud.Error('Invalid parameters');
    }

    let dateFormat = /\b[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z\b/;
    if (!dateFormat.test(body.date)) {
        throw new AV.Cloud.Error('Invalid parameters');
    }

    let targetCategory = await (new AV.Query).get(body.category);
    if(!targetCategory){
        throw new AV.Cloud.Error('Category not exist');
    }
    let categoryIoType = targetCategory.io;

    let newRecord = new AV.Object('Records');



    newRecord.set('user', request.currentUser);
    newRecord.set('category', { __type: 'Pointer', className: 'Category', objectId: body.category });
    newRecord.set('amount', body.amount);
    newRecord.set('description', body.description);
    newRecord.set('date', { __type: 'Date', iso: body.date });

    let acl = new AV.ACL();
    acl.setWriteAccess(request.currentUser, true);
    acl.setReadAccess(request.currentUser, true);
    newRecord.setACL(acl);

    let resultToReturn = newRecord.save();

    let sideEffects = [];

    sideEffects.push(resultToReturn);
    console.log('Here!');

    let fcnRuns = [];
    //Stat for each month, no category specified
    fcnRuns.push(changeStat(request.currentUser,'month',body.date,body.amount,categoryIoType,false,null,sideEffects));
    //Stat for each month, with category specified
    fcnRuns.push(changeStat(request.currentUser,'month',body.date,body.amount,categoryIoType,true,body.category,sideEffects));
    //Stat for each year, no category specified
    fcnRuns.push(changeStat(request.currentUser,'year',body.date,body.amount,categoryIoType,true,null,sideEffects));
    //Stat for each year, with category specified
    fcnRuns.push(changeStat(request.currentUser,'year',body.date,body.amount,categoryIoType,true,body.category,sideEffects));
    //Stat for each day, no category specified
    fcnRuns.push(changeStat(request.currentUser,'day',body.date,body.amount,categoryIoType,true,null,sideEffects));

    await Promise.all(fcnRuns);
    await Promise.all(sideEffects.concat([resultToReturn]));

    return resultToReturn;
});
