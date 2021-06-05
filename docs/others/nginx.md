# nginx

### 配置文件

nginx的配置文件nginx.conf，一般是在/etc/nginx文件夹下。
配置文件由多个块组合。

#### http块

- server

```conf
server {
  # listen指监听本地址的某个端口号
  listen: 80;
  # listen_name指的是请求头部中的host字段
  listen_name: example.com;
  # location映射到那个服务器或是静态文件上
  location / {

  }
}
```