<template>
	<div>
		<Header title="차수 관리"
			search-placeholder="고객사 명" :search-key-default="searchKey" @search="search" @reset="search(null)"
			:dropDown="true" @statusChange="statusChange">
			<!--<router-link :to="{ path: '/register/createPage' }"></router-link>-->
		</Header>

		<Content>
			<Table :headers="['No',{column:'고객사',default:false,var:'company'},
							  '담당자','회차','학습률','빌링',
							  {column:'현재상태',default:true,var:'status'},
							  {column:'학습시작일',default:false,var:'fr_dt'},
							  {column:'학습종료일',default:false,var:'to_dt'},'수정일시']
							.concat($shared.isSupervisor()?['차수관리','신청양식설정','신청시작일시','신청종료일시','페이지이동','URL복사']:null)"
				:data="list" @sort="sort" 
				v-slot="{item, i}"> <!--:filter="status"-->
				<td>{{ total - ((current_page - 1) * per_page) - i }}</td>
				<td>{{ item.company }}</td>
				<td>{{ item.name }}</td>
				<td>
					<select v-model="item.selectedApplyIdx" v-if="item.batches.length" style="height:30px; width:100%" @change="setBatchState()">
						<option v-for="(apply,i) in item.batches" :value="i" :key="apply.id">
							{{ apply.b_no }}회차
							({{ moment(apply.fr_dt).format('YY.MM.DD') }}-{{ moment(apply.to_dt).format('MM.DD') }}){{ item.batches[item.selectedApplyIdx].del_yn ? ' 취소' : '' }}
						</option>
					</select>
				</td>
				<td>{{
						item.batches.length ? (item.batches[item.selectedApplyIdx].target_rt ? item.batches[item.selectedApplyIdx].target_rt + '%' : '') : ''
					}}
				</td>
				<td>{{ item.batches.length ? (item.batches[item.selectedApplyIdx].use_billing ? '빌링' : '') : '' }}</td>
				<td><label :class="currentStatus(item,1)" style="width:60px;text-align: center">{{ currentStatus(item, 0) }}</label></td>
				<td>{{
						item.batches.length ? (item.batches[item.selectedApplyIdx].fr_dt ? moment(item.batches[item.selectedApplyIdx].fr_dt).format('YY-MM-DD') : '') : ''
					}}
				</td>
				<td>{{
						item.batches.length ? (item.batches[item.selectedApplyIdx].to_dt ? moment(item.batches[item.selectedApplyIdx].to_dt).format('YY-MM-DD') : '') : ''
					}}
				</td>
				<td>{{ item.upd_dt ? moment(item.upd_dt).format('YY-MM-DD HH:mm') : '' }}</td>
				<td v-if="$shared.isSupervisor()" class="text-left" style='white-space: nowrap;'>
					<ItemButton text="추가" variant="page-set" @click="createBatchPage(item.idx,item.company)"/>
					<ItemButton v-if="item.batches.length?(!!item.batches[item.selectedApplyIdx].idx):0" text="수정"
						variant="page-set" @click="editBatchPage(item.batches[item.selectedApplyIdx].idx)"/>
				</td>

				<td v-if="$shared.isSupervisor()" style='white-space: nowrap'>
					<div v-if="item.batches.length">
						<ItemButton v-if="!!item.batches[item.selectedApplyIdx].apply" text="페이지 수정" variant="page-set"
							@click="editApplyPage(item.batches[item.selectedApplyIdx].apply.idx)"/>
						<ItemButton v-else text="페이지 등록" variant="page-set"
							@click="createApplyPage(item.batches[item.selectedApplyIdx].idx, item.idx)"/>
					</div>
				</td>
				<td>{{
						item.batches.length&&item.batches.apply ? (item.batches[item.selectedApplyIdx].apply.fr_dt ? moment(item.batches[item.selectedApplyIdx].apply.fr_dt).format('YY-MM-DD HH:mm') : '') : ''
					}}
				</td>
				<td>{{
						item.batches.length&&item.batches.apply ? (item.batches[item.selectedApplyIdx].apply.to_dt ? moment(item.batches[item.selectedApplyIdx].apply.to_dt).format('YY-MM-DD HH:mm') : '') : ''
					}}
				</td>
				<td v-if="$shared.isSupervisor()">
					<ItemButton v-if="item.batches.length?item.batches[item.selectedApplyIdx].apply:0" text="페이지 이동"
						variant="primary" @click="goToApplyPage(applyPageUrl(item,item.selectedApplyIdx)+'/7788')"/>
				</td>
				<td v-if="$shared.isSupervisor()">
					<a v-if="item.batches.length?item.batches[item.selectedApplyIdx].apply:0"
						@click="copyText(applyPageUrl(item, item.selectedApplyIdx),i)">{{ item.batches[item.selectedApplyIdx].apply.hash }}</a>
					<div class="alert alert-success no-padding" role="alert" v-show="item.isCopy"
						:id="'clipBoardAlert'+i">
						<a href="#" class="alert-link">URL이 클립보드에 복사되었습니다.</a>
					</div>
				</td>
			</Table>
		</Content>

		<Pagination :currentPage="parseInt(current_page)" :totalPage="parseInt(total_page)"
			@returnPage="setCurrentPage"/>
	</div>
</template>

<script>
import api from '@/common/api'
import moment from 'moment'
import Header from "@/components/Header.vue";
import Content from "@/components/Content.vue";
import Table from "@/components/Table.vue";
import ItemButton from "@/components/ItemButton.vue";
import Pagination from "@/components/Pagination.vue";

const hostId = window.location.hostname.split('.')[0].split('-')[1];

let server;
if (hostId !== undefined) {
	server = '-' + hostId;
} else {
	window.location.hostname.split('.')[0] === 'partners' ? server = '' : server = '-dev'
}

const applyPageDomain = 'https://apply' + server + '.tutoring.co.kr/';

export default {
	data() {
		return {
			list: [],
			current_page: 1,
			total_page: 1,
			per_page: 0,
			total: 0,
			searchKey: '',
			sortKey:'status',
			sortType:'asc',
			status: 0,
			moment: moment
		}
	},
	computed: {
		applyPageUrl() {
			return (item, index) => {
				return applyPageDomain + item.batches[index].apply.hash
			}
		}
	},
	components: {
		Header,
		Content,
		Table,
		ItemButton,
		Pagination
	},
	async created() {
		this.searchKey = this.$shared.getCurSite().company;
		this.refreshData()
	},
	methods: {
		async refreshData() {
			let params
			if(this.status) params = {sk: this.searchKey, page: this.current_page, sortCol:this.sortKey, sortType:this.sortType, status:this.status}
			else params = {sk: this.searchKey, page: this.current_page, sortCol:this.sortKey, sortType:this.sortType}
			const {data} = await api.get('/partners/siteBatchList', params)
			let list = data.data;
			list.forEach(item => {
				item.selectedApplyIdx = 0,
					item.isCopy = false
			})
			this.list = list
			this.current_page = data.current_page
			this.total_page = data.last_page
			this.per_page = data.per_page
			this.total = data.total

			this.setBatchState()
		},
		setBatchState() {
			const date = moment().format('YYYY-MM-DD')
			this.list.forEach(item => {
				if (item.batches.length && date >= item.batches[item.selectedApplyIdx].fr_dt && date <= item.batches[item.selectedApplyIdx].to_dt) {
					item['status']=1
				} else if (item.batches.length && date < item.batches[item.selectedApplyIdx].fr_dt) {
					item['status']=2
				} else if (item.batches.length && date > item.batches[item.selectedApplyIdx].to_dt) {
					item['status']=3
				}
			})
		},
		async search(searchKey) {
			this.searchKey = searchKey
			this.current_page = 1
			this.$shared.setCurSite({company: searchKey})
			this.refreshData()
		},
		async setCurrentPage(page) {
			this.current_page = page
			this.refreshData()
		},


		copyText: function (text, index) {
			this.$copyText(text).then((e) => {
				this.list[index].isCopy = true
				let $targetElement = document.getElementById('clipBoardAlert' + index)
				this.fadeout($targetElement, index)
				console.log(e)
			}, (e) => {
				console.log(e)
			})
		},
		goToApplyPage: function (url) {
			window.open(url, '_blank')
		},
		fadeout: function (element, index) {
			var op = 1  // initial opacity
			var timer = setInterval(() => {
				if (op <= 0.1) {
					clearInterval(timer)
					this.list[index].isCopy = false
				}
				element.style.opacity = op
				element.style.filter = 'alpha(opacity=' + op * 100 + ')'
				op -= op * 0.1
			}, 50)
		},
		createBatchPage(bsIdx, company) {
			this.$router.push({
				name: 'batchNew',
				params: {bsIdx: bsIdx, company: company}
			})
		},
		editBatchPage(bIdx) {
			this.$router.push({
				name: 'batchEdit',
				params: {bIdx: bIdx}
			})
		},
		editApplyPage(baIdx) {
			this.$router.push({
				name: 'batchApplyPageForm',
				params: {baIdx: baIdx}
			})
		},
		createApplyPage(bIdx, bsIdx) {
			this.$router.push({
				name: 'batchApplyPageNew',
				params: {bIdx: bIdx, bsIdx}
			})
		},
		currentStatus(item, val) {
			const date = moment().format('YYYY-MM-DD')
			if (item.status===1) {
				return val ? 'b-r-sm bg-primary' : '진행중'
			} else if (item.status===2) {
				return val ? 'b-r-sm bg-warning' : '대기중'
			} else if (item.status===3) {
				return val ? 'b-r-sm bg-success' : '완료'
			}
		},
		sort(sortKey) {
			if((sortKey === this.sortKey) && (this.sortType === 'asc')) this.sortType = 'desc'
			else if((sortKey === this.sortKey) && (this.sortType === 'desc')) this.sortType = 'asc'
			else if(sortKey !== this.sortKey) this.sortType = 'asc'
			this.sortKey = sortKey
			this.refreshData()
		},
		statusChange(event) {
			this.status = parseInt(event)
			this.current_page = 1
			this.refreshData()
		}
	}
}
</script>

<style scoped>
.title {
	height: 65px;
}

.content {
	padding: 15px;
}

.table th,
.table td {
	padding-bottom: 8px;
}

.btn-page-set {
	color: #1e9ed3;
	background-color: #fff;
	border: 1px solid #1e9ed3;
	border-radius: 0px;
}

.table {
	margin: 0px;
}
</style>
