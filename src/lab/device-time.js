const clockFormat=new Intl.DateTimeFormat('es-CL',{hour:'2-digit',minute:'2-digit',hourCycle:'h23'});

export const deviceTime=()=>new Date();
export const formatPhoneTime=(date=deviceTime())=>clockFormat.format(date);
