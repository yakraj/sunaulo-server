const getFilterKeysHandler = (db) => (req, res) => {

function FilterClean(obj) {
  for (var propName in obj) {
    if (obj[propName] === null || obj[propName] === undefined || obj[propName] === "") {
      delete obj[propName];
    }
    else if (propName == "id"){delete obj[propName];}
    else if (propName == "thumbnail"){delete obj[propName];}
    else if (propName == "price"){delete obj[propName];}
    else if (propName == "location"){delete obj[propName];}
    else if (propName == "catogery"){delete obj[propName];}
    else if (propName == "subcatogery"){delete obj[propName];}
    else if (propName == "adid"){delete obj[propName];}
    else if (propName == "tags"){delete obj[propName];}
    else if (propName == "description"){delete obj[propName];}
    else if (propName == "title"){delete obj[propName];}
    else if (propName == "supercatogery"){delete obj[propName];}
  }
  return obj
}


	
  const {keyword, filter} = req.body;
  var Keys = [];
  var FilterKeys = [];
  db.select('*').from('archive').where('tags', 'like', `%${keyword}%`).then(response => {

    response.map((nn,i) => newData = Object.keys(response[i]) && FilterClean(response[i]))
    response.map((val, i) => {
    Keys.push(Object.keys(response[i]));
  });
    Keys.map((nn, i) => (FilterKeys = [...FilterKeys, ...Keys[i]]));
    const uniqueValue = [...new Set(FilterKeys)];
    res.json(uniqueValue)
  })
}


module.exports = {
	getFilterKeysHandler: getFilterKeysHandler
}