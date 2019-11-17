function Dictionary()
{
    this.datastore = [];

    this.addKeyValuePair = function(key,value)
    {
        if(key && value)
        {
            this.datastore.push({Key: key, Value: value});
        }
        return this.datastore;
    };
    this.removeKeyValuePair = function(key)
    {
        for(var i = 0; i < this.datastore.length; i++)
        {
            if(this.datastore[i].Key === key)
            {
                this.datastore.splice(i,1);
                return this.datastore;
            }
        }
        return this.datastore;
    };
    this.removeKeyValuePairDuplicates = function(key)
    {
        for( i = 0; i < this.datastore.length; i++)
        {
            if(this.datastore[i].Key === key)
            {
                x.push(i);
            }
        }
        if (x.length > 1)
        {
            for( q = 0; q < (x.length - 1); q++)
            {
                this.datastore.splice(x[q],1);
            }
        }
        return this.datastore;
    };
    this.findKeyValuePair = function(key)
    {
        for(var i = 0; i < this.datastore.length; i++)
        {
            if(this.datastore[i].Key === key)
            {
                return this.datastore[i].Value;
            }
        }
        return 0;
    };
    this.length = function()
    {
        return this.datastore.length;
    }
    this.data = function()
    {
        return this.datastore;
    }
}

module.exports = {Dictionary: Dictionary};