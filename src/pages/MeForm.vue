<template>
<div>
	<Header title="본인정보 수정"></Header>
    <div id="content" class="ibox-content">
        <div class="row">
            <div class="col-md-offset-3">
                <div>
                    <div class="field">
                        <th>현재 비밀번호</th>
                        <td><input type="password" class="form-control" v-model="curPw" ref="curPw"/></td>
                        <span class="notice" v-if="newPw?!curPw:false" style="margin-left:25px;">현재 비밀번호를 입력해 주세요.</span>
                    </div><br/>
                    <div class="field" style="margin-top:10px">
                        <th>새 비밀번호</th>
                        <td><input type="password" class="form-control" v-model="newPw"/></td>
                        <span class="notice" v-if="curPw?!newPw:false" style="margin-left:25px;">새 비밀번호를 입력해 주세요.</span>
                        <span class="notice" v-if="curPw && newPw && curPw==newPw" style="margin-left:25px;">현재 비밀번호와 동일합니다. 다르게 입력해 주세요.</span>
                    </div><br/>
                    <div class="field">
                        <th>새 비밀번호 확인</th>
                        <td><input type="password" class="form-control" v-model="newPwCheck"/></td>
                        <span class="notice" v-if="newPw !== newPwCheck" style="margin-left:25px;">
							<span v-if="newPwCheck">새 비밀번호 확인과 서로 일치하지 않습니다.</span>
							<span v-else>새 비밀번호 확인을 입력해 주세요.</span>
						</span>
                    </div><br/>
                </div>
            </div>
        </div>
        <div class="col-md-offset-3">
            <span class="notice">
                ❊ 비밀번호는 대,소문자,숫자,특수기호 조합으로 10글자 이상으로 설정하셔야 합니다.<br/>
                ❊ 본 시스템은 개인정보등 민감한 정보를 취급하므로 비밀번호가 유출되지 않도록 각별히 주의 바랍니다.<br/>
                ❊ 비밀번호 등 접속 계정 정보 관리 소홀로 발생하는 민형사상 모든 책임은 계정 담당자에게 있습니다.<br/>
            </span>
        </div>
        <div class="hr-line-dashed"></div>
        <div class="row">
            <div class="col-md-offset-3">
                <div>
                    <div class="field">
                        <th>이름</th>
                        <td><input type="text" class="form-control" v-model="name"/></td>
                        <span class="notice" v-if="!name" style="margin-left:25px;">이름을 입력해 주세요.</span>
                    </div><br/>
                    <div class="field">
                        <th>이메일</th>
                        <td><input type="text" class="form-control" v-model="email"/></td>
                        <span class="notice" v-if="!email" style="margin-left:25px;">이메일을 입력해 주세요.</span>
                    </div><br/>
                    <div class="field">
                        <th>전화/휴대폰</th>
                        <td><input type="text" class="form-control" v-model="tel"/></td>
                        <span class="notice" v-if="!tel" style="margin-left:25px;">전화/휴대폰을 입력해 주세요.</span>
                    </div><br/>
                </div>
            </div>
        </div>
        <div class="text-center">
            <br/><br/><a class="btn btn-primary" @click="save" :disabled="!isSave()">수정</a>
        </div>
    </div>
</div>
</template>

<script>
import Header from "@/components/Header.vue";
import shared from "@/common/shared";
import api from "@/common/api";

export default {
    data() {
        return {
            curPw: '',
            newPw: '',
            newPwCheck: '',
            name: '',
            email: '',
            tel: ''
        }
    },
    components: {
        Header
    },
    created() {
        const me = this.$shared.getAccount()
    	this.name = me.name
        this.email = me.email
        this.tel = me.tel

		if(me.needChangePw) {
			this.$swal.fire({
				title: '비밀번호 변경 안내',
				html: '보안 강화를 위해 최초 1회<br/>직접 비밀번호를 변경하셔야 합니다.'
			}).then(()=>{
				this.$refs.curPw.focus()
			})
		}
    },
    methods: {
        isSave() {
            return this.name && this.email && this.tel && (this.curPw?this.newPw:true) && (this.newPw?this.curPw:true) && (this.newPw === this.newPwCheck) && (this.curPw&&this.newPw?this.curPw!=this.newPw:true)
        },
        save() {
            if(this.isSave()) {
                this.$swal.fire({
                    title: `수정하시겠습니까?`,
                    icon: 'warning',
                    showCancelButton: true,
                    cancelButtonText: '닫기',
                    cancelButtonColor: '#808080',
                    confirmButtonColor: '#ed5565',
                    reverseButtons: true,
                }).then (async r => {
					if (r.isConfirmed) {
                        let params
                        if(this.newPwCheck) params = { name:this.name, email:this.email, tel:this.tel, curPw:this.curPw, newPw:this.newPw }
                        else params = { name:this.name, email:this.email, tel:this.tel }

                        const { result, message } = await api.post("/partners/me", params );
                        if(result === 2000) {
                            let account = this.$shared.getAccount()
                            account.name = this.name
                            account.email = this.email
                            account.tel = this.tel
                            this.$shared.setAccount(account)
                            this.$swal.fire({
                                title: `수정되었습니다.`,
                                icon: 'success',
                                confirmButtonColor: '#ed5565',
                            }).then(() => {
								if(this.newPw) {
									this.$swal.fire({
										html: '새로운 비밀번호로<br/>다시 로그인 바랍니다.',
										icon: 'success',
										confirmButtonColor: '#ed5565',
									}).then(r => {
										this.$shared.logout()
									})
								}
                            })
                        } else if(result === 1000) {
                            this.$swal.fire({
                                title: message,
                                icon: 'warning',
                                confirmButtonText: 'OK',
                                confirmButtonColor: '#ed5565',
                            })
                        }
                    }
                })
            }

        }
    },
    /*watch: {
        notice() {
            console.log('@@@',this.curPw?(this.newPw&&this.newPwCheck):true)
            console.log(this.newPw === this.newPwCheck)
             console.log(this.name,'@@@')
            if(this.curPw?(this.newPw&&this.newPwCheck):true && this.newPw === this.newPwCheck && this.name && this.email && this.tel)
            console.log('213213')
            return false
        }
    }*/
}
</script>

<style scoped>
.notice {
    color: red;
}
#content {
	line-height: 1.8;
	padding: 12px 15px;
	margin: 0px 10px;
}
th {
    width: 140px;
    padding-top: 6px;
}
td {
    width: 250px;
    padding-top: 6px;
}
.field {
    display: inline;
    padding-top: 6px;
}
</style>
