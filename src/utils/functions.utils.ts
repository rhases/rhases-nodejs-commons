'use strict'

import l from '../logger';


export function concatFunctions(firstFnc, secondFnc){
  return firstFnc
    ?
      secondFnc ? (...param) => firstFnc(secondFnc(...param))
      : firstFnc
    :
      secondFnc ? secondFnc
      : this.nop
}

/** create a sync chain **/
export function now(value, err?) {
  return {

    then:(fnc) => {
      if(err){ return now(undefined, err)} //skip til catch
      /* call and rewrap */
      try{
        return now(fnc(value));
      }catch(_err){
        return now(undefined, _err)
      };
    },
    catch:(fnc) => {
      fnc(err);
      return now(undefined, undefined)
    } ,
    value:() => {if(err){ throw err }; return  value}
  }
}

export function nop(param) {return param}
