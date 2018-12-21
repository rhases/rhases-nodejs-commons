export class CallOptions {
    
    constructor(
        public beforeSave: (entity: any) => any, 
        public afterSave: (entity: any) => any, 
        public transformOut: (entity:any) => any){
    }
}