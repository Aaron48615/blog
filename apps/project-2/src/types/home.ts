// 轮播
export interface banner {
  imgUrl: string;
  seq: number;
  uploadTime: string;
  type: number;
  relation: number;
}

// 通知
export interface notice {
  content: string | null;
  id: number;
  publishTime: string;
  shopId: number;
  title: string;
}

// 商品
export interface prodItem {
  brief: string;
  categoryId: number | null;
  content: string | null;
  imgs: string | null;
  oriPrice: number | null;
  pic: string;
  price: number;
  prodId: number;
  prodName: string;
  shopId: number;
  shopName: string;
  skuList: any | null;
  totalStocks: number | null;
  transport: null;
}
export interface prod {
  id: number;
  productDtoList: prodItem[];
  seq: number;
  style: string;
  title: string;
}
