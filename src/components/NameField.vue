<template>
	<span class="container">
		<span class="name" @click="openUserInfo">{{item.user.name}}</span>
	    <UserInfoModal :data="modalitem" v-if="showModal" @close="showModal = !showModal"/>
	</span>
</template>

<script>
import shared from "@/common/shared"
import UserInfoModal from "@/modals/UserInfoModal.vue";

export default {
    data() {
        return {
            modalitem: [],
            showModal: false
        }
    },
	props: {
		item: Object
    },
    components: {
		UserInfoModal
	},
	methods: {
		async openUserInfo() {
            this.modalitem = await shared.getUserInfo(this.item.idx)
			this.showModal = !this.showModal
		},
	}
};
</script>

<style scoped>
.cusId {
	font-family: monospace;
	color: #1a7bb9;
}
.cusId:hover {
	color: #9c0000;
}
</style>
