// 类型补充文件

interface ImportMetaEnv {
    readonly VITE_AMAP_KEY: string;
    readonly VITE_AMAP_SECURITY_KEY: string;
}

interface Window {
    _AMapSecurityConfig?:{
        securityJsCode: string
    }
}