<script lang="ts" setup>
  import {
    FlexRender,
    createColumnHelper,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useVueTable,
    type ColumnFiltersState,
    type SortingState,
  } from "@tanstack/vue-table";
  import { refThrottled } from "@vueuse/core";
  import type { ApiOutput } from "api";
  import { LoaderIcon } from "lucide-vue-next";
  import SaasAdminUserListActionsCell from "./SaasAdminUserListActionsCell.vue";
  import SaasAdminUserListInfoCell from "./SaasAdminUserListInfoCell.vue";

  const { apiCaller } = useApiCaller();
  const { t } = useTranslations();
  const itemsPerPage = ref(10);
  const currentPage = ref(1);
  const searchTerm = ref("");
  const sorting = ref<SortingState>([]);
  const columnFilters = ref<ColumnFiltersState>([]);
  const throttledSearchTeam = refThrottled(searchTerm, 500);

  const { data, pending } = apiCaller.admin.users.useQuery(
    () => ({
      limit: itemsPerPage.value,
      offset: (currentPage.value - 1) * itemsPerPage.value,
      searchTerm: throttledSearchTeam.value,
    }),
    {
      watch: [throttledSearchTeam, currentPage, sorting, columnFilters],
    },
  );

  watch(throttledSearchTeam, () => {
    currentPage.value = 1;
  });

  const columnHelper =
    createColumnHelper<ApiOutput["admin"]["users"]["users"][number]>();
  const columns = ref([
    columnHelper.accessor((row) => row, {
      id: "user",
      cell: (row) => h(SaasAdminUserListInfoCell, { user: row.getValue() }),
    }),
    columnHelper.accessor((row) => row, {
      id: "actions",
      cell: (row) => h(SaasAdminUserListActionsCell, { user: row.getValue() }),
    }),
  ]);

  const users = computed(() => data.value?.users ?? []);

  const table = useVueTable({
    get data() {
      return data.value?.users ?? [];
    },
    get columns() {
      return columns.value;
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    state: {
      get sorting() {
        return sorting.value;
      },
      get columnFilters() {
        return columnFilters.value;
      },
    },
  });
</script>

<template>
  <div class="bg-card rounded-sm p-6 shadow-sm">
    <h2 class="mb-4 text-2xl font-semibold">{{ $t("admin.users.title") }}</h2>
    <Input
      type="search"
      :placeholder="t('admin.users.search')"
      v-model="searchTerm"
      class="mb-4"
    />

    <div class="rounded-md border">
      <Table class="w-full">
        <TableBody>
          <template v-if="users?.length > 0">
            <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="py-2 group-first:rounded-t-md group-last:rounded-b-md"
              >
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </TableCell>
            </TableRow>
          </template>

          <TableRow v-else>
            <TableCell :colSpan="columns.length" class="h-24 text-center">
              <div
                v-if="pending"
                class="flex h-full items-center justify-center"
              >
                <LoaderIcon class="text-primary mr-2 size-4 animate-spin" />
                {{ $t("admin.users.loading") }}
              </div>

              <p v-else>No results.</p>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <Pagination
      class="mt-4"
      v-slot="{ page }"
      :page="currentPage"
      @update:page="(page) => (currentPage = page)"
      :total="data?.total ?? 0"
      :sibling-count="1"
      show-edges
      :default-page="1"
    >
      <PaginationList
        v-slot="{ items }"
        class="flex items-center justify-center gap-1"
      >
        <PaginationPrev />

        <template v-for="(item, index) in items">
          <PaginationListItem
            v-if="item.type === 'page'"
            :key="index"
            :value="item.value"
            as-child
          >
            <Button
              class="size-10 p-0"
              :variant="item.value === page ? 'default' : 'outline'"
            >
              {{ item.value }}
            </Button>
          </PaginationListItem>
          <PaginationEllipsis v-else :key="item.type" :index="index" />
        </template>

        <PaginationNext />
      </PaginationList>
    </Pagination>
  </div>
</template>
