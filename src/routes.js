import Login from "@/pages/Login.vue";
import Register from "@/pages/Register.vue";
import Main from "@/Main.vue";
import ReportList from "@/pages/ReportList.vue";
import ApplyList from "@/pages/ApplyList.vue";
import ApplyForm from "@/pages/ApplyForm.vue";
import IssueList from "@/pages/IssueList.vue";
import BillingList from "@/pages/BillingList.vue";
import BillingPenaltyList from "@/pages/BillingPenaltyList.vue";
import BatchList from "@/pages/BatchList.vue";
import BatchApplyForm from "@/pages/BatchApplyForm.vue";
import BatchForm from "@/pages/BatchForm.vue";
import SiteList from "@/pages/SiteList.vue";
import SiteForm from "@/pages/SiteForm.vue";
import UserForm from "@/pages/UserForm.vue";

const routes = [
	{path: "", redirect: "/login"},
	{path: "/login", component: Login},
	{path: "/register", component: Register},
	{
		path: "/main",
		component: Main,
		children: [
			{path: "/", redirect: "/report/list"},
			{path: '/report/list', component: ReportList},
			{path: '/apply/list', component: ApplyList},
			{path: "/apply/form/:bbIdx", name: "applyForm", component: ApplyForm, props: true},
			{path: '/issue/list', component: IssueList},
			{path: '/billing/list', component: BillingList},
			{path: '/billingP/list', component: BillingPenaltyList},
			{path: "/batch/list", component: BatchList},
			{path: "/batch/form/:bIdx/:bsIdx", name: "batchApplyNew", component: BatchApplyForm, props: true},
			{path: "/batch/form/:baIdx", name: "batchApplyForm", component: BatchApplyForm, props: true},
			{path: "/batch/form/:bsIdx/:company", name: "batchNew", component: BatchForm, props: true},
			{path: "/batch/form/:bIdx", name: "batchEdit", component: BatchForm, props: true},
			{path: '/site/list', name: "siteList", component: SiteList},
			{path: "/site/form", name: "siteNew", component: SiteForm, props: true},
			{path: "/site/form/:idx", name: "siteForm", component: SiteForm, props: true},
			{path: "/user/form", component: UserForm},
		],
	},
];

export default routes;
