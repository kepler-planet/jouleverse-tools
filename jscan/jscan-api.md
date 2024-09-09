# JSCAN API

## 1. 概述

为 JouleVerse 区块链提供简易的交易数据访问接口。

## 2. 功能

### /api/block/:blockNumber

> 返回单个区块的信息，及区块中的交易列表。
> 
> 示例: [/api/block/4050089](/api/block/4050089)

### /api/tx/:transactionHash

> 返回单个交易的信息。
>
> 示例: [/api/tx/0xb174f431d6e4b0995dba60a8bbf40785607fbb9ebb3b6fce82b607a522750ad1](/api/tx/0xb174f431d6e4b0995dba60a8bbf40785607fbb9ebb3b6fce82b607a522750ad1)

## /api/txs

> 返回交易列表，支持分页和过滤。
>
> 按区块ID倒序排列，即最新的交易排在最前面。
>
> 参数：
- `page`: 页码，默认为 1
- `size`: 每页条数，默认为 10，最大 100
- `start_block`: 区块高度区间
- `end_block`: 区块高度区间
- `from_address`: 交易发起地址
- `to_address`: 交易接收地址

> 示例: [/api/txs?start_block=4015500&end_block=4018500&page=2](/api/txs?start_block=4015500&end_block=4018500&page=2)
