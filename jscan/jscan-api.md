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
> **查询策略**：
> 1. 优先从数据库查询交易对应的区块高度，然后通过区块高度获取完整交易数据（解决老交易查询失败问题）
> 2. 如果数据库中没有记录，直接通过web3.eth.getTransaction()查询
> 3. 返回结果包含查询源信息，方便调试
>
> **增强功能**：
> - 解决老交易查询失败的问题
> - 提供数据库状态信息（receipt_status等）
> - 自动解码交易输入数据
>
> 示例: [/api/tx/0xb174f431d6e4b0995dba60a8bbf40785607fbb9ebb3b6fce82b607a522750ad1](/api/tx/0xb174f431d6e4b0995dba60a8bbf40785607fbb9ebb3b6fce82b607a522750ad1)

### /api/tx/:transactionHash/simple

> 简化版本，直接从数据库返回交易数据，不通过区块链验证。
>
> **特点**：
> - 查询速度更快（纯数据库查询）
> - 包含区块哈希和时间戳信息
> - 同样支持交易输入解码
> - 适合对数据实时性要求不高的场景
>
> 示例: [/api/tx/0xb174f431d6e4b0995dba60a8bbf40785607fbb9ebb3b6fce82b607a522750ad1/simple](/api/tx/0xb174f431d6e4b0995dba60a8bbf40785607fbb9ebb3b6fce82b607a522750ad1/simple)

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
