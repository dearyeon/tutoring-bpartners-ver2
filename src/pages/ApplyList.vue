<template>
	<div><!-- v-model:isCancel-->
		<Header title="신청 관리"
				:use-batch-selection="true" @changeBatch="refreshData"
				search-placeholder="이름 or 이메일 or 고객식별ID" @search="setSearch" @reset="setSearch"
				switch1-text="취소포함" @switch1-change="toggleCancel"
				btn1-text="양식 다운로드" @btn1-click="exportFormat" btn1-variant="success" :btn1-loading="loading1" :btn1-hide="!$shared.isSupervisor()"
				btn2-text="일괄 신청" @btn2-click="$refs.file.click()" btn2-variant="primary" :btn2-loading="loading2" :btn2-hide="!$shared.isSupervisor()"
				btn3-text="일괄 승인" @btn3-click="approveBatchCheck" btn3-variant="success btn-outline" :btn3-loading="loading3" :btn3-hide="!$shared.isSupervisor()"
				btn4-text="단건 신청" @btn4-click="routeIndivApply" btn4-variant="warning" :btn4-hide="!$shared.isSupervisor()">
		</Header>
		<input type="file" id="file" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
			   ref="file" @change="importExcel"/>

		<Content>
			<Table
				:headers="['No',{column:'이름',default:true,var:{var1:'user',var2:'name'}},
							'고객식별ID','이메일','연락처','부서','직위','사번']
							.concat(cfs.map(a => a.title))
							.concat([{column:'수강권',default:false,var:{var1:'goods',var2:'charge_plan',var3:'title'}},
							'제공가','회사지원','자기부담',
							{column:'관리메모',default:false,var:{var1:'mng_memo'}},
							{column:'관리정보',default:false,var:{var1:'mng_info'}},
							'신청번호',{column:'신청일시',default:false,var:{var1:'apply_dt'}},
							{column:'취소일시',default:false,var:{var1:'apply_ccl_dt'}},
							{column:'승인일시',default:false,var:{var1:'approve_dt'}}])
							.concat($shared.isSupervisor()?['승인','취소/복원']:null)
							.concat( applyBatchError ? ['승인결과'] : null)"
				:data="orders" @sort="sort"
				v-slot="{item, i}">
				<td>{{ i + 1 }}</td>
				<td><NameField :item="item"></NameField></td>
				<td><CusIdField :user="item.user"/></td>
				<td>{{ item.user.email }}</td>
				<td>{{ item.user.cel }}</td>
				<td><div class="department">{{ item.user.department }}</div></td>
				<td>{{ item.user.position }}</td>
				<td>{{ item.user.emp_no }}</td>
				<td v-for="col in cfs" :key="col.id">{{ getGTP(col.type, item.user[col.col_id]) }}</td>
				<td>{{ item.goods ? item.goods.charge_plan.title : '' }}</td>
				<td>{{ item.goods ? $shared.nf(item.goods.supply_price) : '' }}</td>
				<td>{{ item.goods ? $shared.nf(item.goods.supply_price - item.goods.charge_price) : '' }}</td>
				<td>{{ item.goods ? $shared.nf(item.goods.charge_price) : '' }}</td>
				<td>
					<MngField btn-title="관리메모" :item="item" :data="item.mng_memo" @click="memoModalOpen"/>
				</td>
				<td>
					<MngField btn-title="관리정보" :item="item" :data="item.mng_info" @click="infoModalOpen"/>
				</td>
				<td>{{ item.idx }}</td>
				<td>{{ moment(item.apply_dt).format('YYYY-MM-DD HH:mm') }}</td>
				<td>{{ item.apply_ccl_dt && moment(item.apply_ccl_dt).format('YYYY-MM-DD HH:mm') }}</td>
				<td>{{ item.approve_dt && moment(item.approve_dt).format('YYYY-MM-DD HH:mm') }}</td>
				<td>
					<ItemButton v-if="$shared.isSupervisor() && !item.approve_dt && !item.apply_ccl_dt" text="승인" variant="success btn-outline"
								@click="approve(item)"/>
				</td>
				<td v-if="$shared.isSupervisor()">
					<ItemButton v-if="!!item.apply_ccl_dt" text="복원" variant="primary" @click="applyReviveCheck(item)"/>
					<ItemButton v-else text="취소" variant="danger" @click="cancel(item)"/>
				</td>
				<td v-if="applyBatchError"><p>{{ item.applyResultMsg }}</p></td>
			</Table>
		</Content>

		<MngTextModal title="관리정보" :content="content" v-if="showInfoModal" @close="showInfoModal = !showInfoModal" @save="updateInfo"/>

		<MngTextModal title="관리메모" :content="content" v-if="showMemoModal" @close="showMemoModal = !showMemoModal" @save="updateMemo"/>

	</div>
</template>

<script>
import api from "@/common/api";
import moment from 'moment'
import shared from "@/common/shared";
import XLSX from 'xlsx'
import _ from 'lodash'
import Header from "@/components/Header.vue";
import Content from "@/components/Content.vue";
import NameField from "@/components/NameField.vue";
import CusIdField from "@/components/CusIdField.vue";
import ModalField from "@/components/CusIdField.vue";
import Table from "@/components/Table.vue";
import ItemButton from "@/components/ItemButton.vue";
import MngTextModal from "@/modals/MngTextModal.vue";
import MngField from "@/components/MngField";
import modal from "@/common/modal.js";

export default {
	data() {
		return {
			cfs: [],
			cfsHeader: [],
			applyBatchError: false,
			applyResultMsgs: {},
			ordersAll: [],
			orders: [],
			includeCancel: false,
			curBBIdx: 0,
			curOrder: 0,
			showMemoModal: false,
			showInfoModal: false,
			content: '',
			sk: '',
			moment: moment,
			loading1:false,
			loading2:false,
			loading3:false,
		}
	},
	components: {
		Header,
		Content,
		NameField,
		CusIdField,
		ModalField,
		Table,
		ItemButton,
		MngTextModal,
		MngField
	},
	created() {
		this.refreshData()
	},
	methods: {
		async refreshData() {
			this.curBBIdx = shared.getCurBatch().idx
			const res = await api.get('/partners/applyOrderList', {
				bbIdx: this.curBBIdx
			})
			const data = res.data
			this.cfs = data.cfs
			this.ordersAll = data.orders
			this.orders = this.ordersAll

			// 일괄승인 결과에 errorMsgs가 있을 때
			if (this.applyBatchError) {
				data.orders.forEach(item => {
					const keys = Object.keys(this.applyResultMsgs)
					if (keys.indexOf(item.idx.toString()) >= 0) {
						item.applyResultMsg = this.applyResultMsgs[item.idx]
					} else {
						item.applyResultMsg = '승인'
					}
				})
			}

			this.filteredData()
			this.$shared.sortBy(this.orders,'user','name')
		},

		filteredData() {
			this.orders = this.ordersAll

			if(!this.includeCancel) {
				this.orders = this.orders.filter((order) => {
					return order.apply_ccl_dt === null
				})
			}

			if (this.sk) {this.orders = this.orders.filter((order) => {
				return !order.user.name.indexOf(this.sk) ||
					(order.user.cus_id && !order.user.cus_id.indexOf(this.sk)) ||
					(order.user.email && !order.user.email.indexOf(this.sk))
			})}
		},

		getGTP(type, val) {
			if (type == 'S') {
				return val ? this.cfs[1].opts[1] : this.cfs[1].opts[0]
			} else {
				return val
			}
		},

		importExcel: _.debounce(function (event) {
			this.loading2 = true

			let input = event.target.files[0]
			let reader = new FileReader()
			let value = []
			reader.onload = async () => {
				let data = reader.result
				let workBook = XLSX.read(data, {type: 'binary'})
				let cnt = 0
				workBook.SheetNames.forEach(async function (sheetName) {
					let rows = XLSX.utils.sheet_to_json(workBook.Sheets[sheetName])
					rows.forEach( row => {
						value.push(Object.assign({
							'no': row.No ? row.No : '',
							'name': row.이름 ? row.이름 : '',
							'email': row.이메일 ? row.이메일 : '',
							'cpIdx': row.수강권idx ? row.수강권idx : '',
							'수강권': row.수강권 ? row.수강권 : '',
							'company': row.소속 ? row.소속 : '',
							'department': row.부서 ? row.부서 : '',
							'position': row.직급 ? row.직급 : '',
							'empNo': row.사번 ? row.사번 : '',
							'cel': row.연락처 ? row.연락처 : '',
							'cf1': row.CF1 ? row.CF1 : '',
							'cf2': row.CF2 ? row.CF2 : '',
						}))
						cnt++
						}
					)
				})

				this.$swal.fire({
					title: `${cnt} 명을 일괄 신청하시겠습니까?`,
					showCancelButton: true,
					confirmButtonText: '일괄 신청하기',
					confirmButtonColor: '#ed5565',
					cancelButtonText: '닫기',
					cancelButtonColor: '#808080',
					reverseButtons: true,
				}).then( async r => {
					if(r.isConfirmed) {
						const res = await api.post('/partners/importApplyListToExcel', {
							bbIdx: shared.getCurBatch().idx,
							rows: JSON.stringify(value)
						})
						if (res.result === 2000) {
							this.$swal.fire({
								title: `${cnt}명 일괄 신청이 완료 되었습니다.`,
								confirmButtonText: 'OK',
							})
							this.refreshData()
						} else if (res.result === 1000) {
							this.$swal.fire({
								title: res.message,
								text: res.data.errMsg,
								icon: 'warning',
								confirmButtonText: 'OK'
							})
						}
					}
				})
			}
			reader.readAsBinaryString(input)
			this.loading2 = false
		}, 500),

		exportFormat: _.debounce(async function () {
			this.loading1 = true
			let dataWs = []
			dataWs.push(Object.assign({
				'No': '',
				'이름': '',
				'이메일': '',
				'수강권idx': '',
				'수강권': '',
				'소속': '',
				'부서': '',
				'직급': '',
				'사번': '',
				'연락처': '',
				'CF1': '',
				'CF2': '',
			}))
			var ws = XLSX.utils.json_to_sheet(dataWs)
			var wb = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(wb, ws, shared.getCurBatch().company + ' ' + shared.getCurBatch().b_no + '회차 신청관리')
			XLSX.writeFile(wb, shared.getCurBatch().company + ' ' + shared.getCurBatch().b_no + '회차 신청관리.xlsx')
			this.loading1 = false
		}, 500),

		toggleCancel(event) {
			this.includeCancel = event
			this.filteredData()
		},

		memoModalOpen(order, content) {
			this.content = content
			this.curOrder = order
			this.showMemoModal = !this.showMemoModal
		},

		infoModalOpen(order, content) {
			this.content = content
			this.curOrder = order
			this.showInfoModal = !this.showInfoModal
		},

		async updateMemo(text) {
			this.showMemoModal = !this.showMemoModal
			const response = await shared.updateMemo(this.curOrder.idx,text);
			if (response === 2000) {
				this.refreshData()
			}
		},

		async updateInfo(text) {
			this.showInfoModal = !this.showInfoModal
			const response = await shared.updateInfo(this.curOrder.idx, text)
			if (response === 2000)  {
				this.refreshData()
			}
		},

		approve(item) {
			modal.confirm(item.user.name, item.user.email, item.user.cus_id, '승인', async()=>{
				return await api.post('/partners/approveOrder', {boIdx: item.idx})
			}, ()=>{
				this.refreshData()
			})
		},

		routeIndivApply() {
			this.$router.push({
				name: 'applyForm',
				params: {bbIdx: shared.getCurBatch().idx}
			})
		},

		async cancel(item) {
			modal.confirm(item.user.name, item.user.email, item.user.cus_id, '취소', async()=>{
				return await api.post('/partners/applyCancel', {boIdx:item.idx})
			}, ()=>{
				this.refreshData()
			})
		},

		async approveBatchCheck() {
			const {result, data} = await api.get('/partners/approveBatchCheck', {bbIdx: this.curBBIdx}).catch((e) => {
				console.log('error : approveBatchCheck ' + e)
			})

			if (result === 2000) {
				this.$swal.fire({
					title: `대상 건수 <strong>${data.targetCnt}</strong>건<br/>`,
					html: `<strong>일괄 승인</strong> 하시겠습니까?`,
					confirmButtonText: '일괄 승인하기',
					confirmButtonColor: '#ed5565',
					cancelButtonText: '닫기',
					cancelButtonColor: '#808080',
					showCancelButton: true,
					reverseButtons: true,
				}).then(async (r) => {
					if (r.isConfirmed) {
						this.approveBatch();
					}
				})
			}
		},

		async approveBatch() {
			this.loading3 = true
			const { result, data } = await api.post('/partners/approveBatch', {bbIdx: this.curBBIdx}).catch((e) => {
				console.log('error : approveBatch ' + e)
			})

			if (result === 2000) {
				this.$swal.fire({
					title: `일괄 신청 결과 입니다.`,
					html: `대상 건수 <strong>${data.targetCnt}</strong>건<br/>성공 건수 <strong>${data.successCnt}</strong>건<br/>실패 건수 <strong>${data.failCnt}</strong>건<br/>`,
				}).then(r => {
					if (r.isConfirmed) {
						if (data.failCnt > 0) {
							this.applyBatchError = true
							this.applyResultMsgs = data.errorMsgs
						} else {
							this.applyBatchError = false
							this.applyResultMsgs = []
						}
						this.refreshData()
					}
				})
			}
			this.loading3 = false
		},
		setSearch(sk) {
			this.sk = sk
			this.filteredData()
		},
		applyReviveCheck(item) {
			modal.confirm(item.user.name, item.user.email, item.user.cus_id, '복원', async()=>{
				return await api.post('/partners/applyRevive', {boIdx:item.idx})
			}, ()=>{
				this.refreshData()
			})
		},
		sort(sortKey) {
			this.$shared.sortBy(this.orders,sortKey.var1,sortKey.var2,sortKey.var3)
		}
	},
}
</script>

<style scoped>
.mng-text {
	overflow: hidden;
	text-overflow: ellipsis;
	width: 70px;
	white-space: nowrap;
}
.department {
	overflow: hidden;
	text-overflow: ellipsis;
	width: 80px;
	white-space: nowrap;
}
</style>
