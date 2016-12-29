
import {Method,ContentType} from './const'

import Promise from 'promise';
import Cache from './cache';
import Queue from './queue'

import auth from './auth';

var merge = function(target) {
    for (var i = 1, j = arguments.length; i < j; i++) {
        var source = arguments[i];
        for (var prop in source) {
            if (source.hasOwnProperty(prop)) {
                var value = source[prop];
                if (value !== undefined) {
                    target[prop] = value;
                }
            }
        }
    }

    return target;
};



/**
 *
 * @param opts:{
 *
 *  cache:{       //cache不传则不开启
 *    exp:1,      //0 不开启
 *    read:-1,    //-1不开启
 *  }
 * }
 * @param parseFunc
 * @returns {*}
 */
export let createApi = (opts,parseFunc) => {


    let cachepattern = opts.cache;

    let cacheKey = opts.cacheKey;

    //强制更新
    if(opts.update){
        Cache.remove(cacheKey);
    }

    //有缓存则返回缓存
    let cacheData = Cache.get(cacheKey);
    if(cacheData){
        return cacheData;
    }

    //没有缓存则从服务器获取

    let checkQueue = Queue.check(cacheKey);
    if(checkQueue){
        return checkQueue;
    }





    var headerConfig =  merge({},opts.headers||{});


    if(auth.getToken()){

        headerConfig["accessToken"] = auth.getToken();
    }




//headerData['Content-Type']= 'multipart/form-data';//'application/octet-stream';
    if(opts.isStream){
        headerConfig['Content-Type']= undefined;//'application/octet-stream';
    }else{
        headerConfig['Content-Type']= ContentType.NORMAL;
    }




    let options = {
        method: opts.method || "GET",
        url: opts.url,
        params: opts.params || {},
        body: opts.data || {},
        headers:headerConfig,
        cache: false,
        timeout: 100000,
        emulateJSON:true
        //withCredentials:true
    }
    let loadingBar = !!opts.progress;
    if(loadingBar){
        AjaxLoading.show();
    }
    var promise = new Promise(function (resolve, reject) {
        Vue.http(options).then(function (response) {
            let resp = response.data;
            if(resp.success){
                cachepattern&&Cache.set(cacheKey,resp,cachepattern);
                Queue.remove(cacheKey);
                resolve(resp.data) ;
            }else{
                Queue.remove(cacheKey);
                if(resp.errCode=="jh0006"){
                    let loginUrl = "#/login";
                    window.location.href= loginUrl;
                }else{
                    if(!opts.silent){
                        toast(resp.message);
                    }
                    reject(response);
                }

            }
            if(loadingBar){
                AjaxLoading.close();
            }
        }, function (response) {
            Queue.remove(cacheKey);
            if(loadingBar){
                AjaxLoading.close();
            }
            let  status = response.status;
            if(status==401){
                toast("接口权限错误");

            }else if(status==500){
                toast("请求报错,请稍后再试.");
                reject(status);
            }else if(status==404){
                //找不到请求
                toast("请求报错,请稍后再试");
                reject(status);
            }else{
                toast("请确认网络连接是否正常");
                reject(status);
            }
        })
    });
    return promise;
};



export let  get=(url,data={}, opts={},parseFunc=undefined) =>{
    let requestUrl =  getApiUrl(opts.apiUrl,url);
    let cacheKey = getCacheKey(url,data);
    data["_"] = Math.random();
    opts.url = requestUrl;
    opts.cacheKey = cacheKey;
    opts.method = Method.GET;
    opts.params = getClearData(data);
    return createApi(opts, parseFunc);
}
export let post=(url,data={}, opts = {},parseFunc=undefined)=> {
    let requestUrl =  getApiUrl(opts.apiUrl,url);
    let cacheKey = getCacheKey(url,data);
    data["_"] = Math.random();
    opts.url = requestUrl;
    opts.cacheKey = cacheKey;
    opts.method =   Method.POST;
    opts.data = getClearData(data);
    return createApi(opts, parseFunc);
}


let utils = {
    getUrl (apiUrl="/",url){

        return apiUrl+url;
    },
    getClearData(data){
        let _data = {};
        for(let prop in data){
            let item = data[prop];
            if(item!=undefined){
                _data[prop] = item;
            }
        }
        return _data;
    },
    getKey(url,data={}){
        data["_"] = undefined;
        return url + JSON.stringify(data);
    }
}

export let stateManager = {
    start(){

    },
    doing(){

    },
    end(){

    }
}

export let resultManager = {

    error(){

    }
}


export let factory =  {
    /**
     * 拦截器(全局)
     */
    interceptors(){
        Vue.http.interceptors.push({

            request: function (request) {
                return request;
            },

            response: function (response) {

                return response;

            }

        });
    },
    headers(){
        let headerConfig = {};
        if(userData){
            if(userData.user&&userData.user.id){
                headerConfig["X-User-Id"]=userData.user.id;
            }
            if(userData.token){
                headerConfig["X-Token"]=userData.token;
            }
        }
        return headerConfig;
    }

}



