const AV = require('leanengine');

AV.Cloud.define('getStat',async function(request){
    let body = request.params;
    
    if(!body.startDate || !body.endDate || !body.type || !body.ioType || typeof body.getAllCategory === 'undefined'){
        throw new AV.Cloud.Error('Invalid parameters');
    }


    let startDate = new Date(body.startDate);
    let endDate = new Date(body.endDate);
    console.log(startDate);
    console.log(endDate);
    console.log(startDate.getTimezoneOffset());

    let query = new AV.Query('Statistics');

    query.equalTo('user',request.currentUser);
    query.equalTo('type',body.type);
    query.equalTo('io',body.ioType);
    query.lessThanOrEqualTo('date',endDate);
    query.greaterThanOrEqualTo('date',startDate);


    if(!body.getAllCategory){
        if(body.category){
            query.equalTo('forCategory',true);
            query.equalTo('category',{__type:'Pointer',className:"Category",objectId: body.category});
        }else{
            query.equalTo('forCategory',false);
        }
    }

    query.ascending('date');

    let rawResult = (await query.find());
    let result = rawResult.map(curr => curr.toJSON());


    if(body.type === 'month'){
        startMonth = startDate.getMonth();
        endMonth = endDate.getMonth();

        for(let i = startMonth; i <= endMonth; i++){
            if(!result.find(element => (new Date(element.date)).getMonth() === i    ) ){
                let fillDate = new Date(startDate);
                fillDate.setMonth(i);

                result.push({
                    category: body.category,
                    date: fillDate,
                    forCategory: body.category ? true : false,
                    io: body.ioType,
                    value: 0
                })
            }
        }
    }
    if(body.type === 'day'){
        startDay = startDate.getDate();
        endDay = endDate.getDate();

        for(let i = startDay; i <= endDay; i++){
            if(!  result.find(element => (new Date(element.date)).getDate() === i) ){
                let fillDate = new Date(startDate);
                fillDate.setDate(i);
                console.log( fillDate.toTimeString() );
                result.push({
                    category: body.category,
                    date: fillDate,
                    forCategory: body.category ? true : false,
                    io: body.ioType,
                    value: 0
                })
            }
        }
    }

    result.sort((a,b) => new Date(a.date) < new Date(b.date) ? -1 : 1);

    return result;

    
})
