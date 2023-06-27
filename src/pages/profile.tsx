import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "~/utils/api";
import clsx from "clsx";
import { useEffect } from "react";

const SDeliveryAddress = z.object({
  id: z.string().optional(),
  street: z.string().min(1, { message: "Required" }),
  city: z.string().min(1, { message: "Required" }),
  state: z.string().min(1, { message: "Required" }),
  zip: z.string().min(1, { message: "Required" }),
});

export default function Profile() {
  const deliveryAddressGetAllQuery = api.deliveryAddress.getAll.useQuery();
  const deliveryAddressCreateMutation =
    api.deliveryAddress.create.useMutation();
  const deliveryAddressUpdateAllMutation =
    api.deliveryAddress.updateAll.useMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<z.infer<typeof SDeliveryAddress>>({
    resolver: zodResolver(SDeliveryAddress),
  });

  const deliveryAddressId = watch("id");

  useEffect(() => {
    if (deliveryAddressGetAllQuery.data?.[0])
      reset(deliveryAddressGetAllQuery.data[0]);
  }, [deliveryAddressGetAllQuery.data]);

  const onSubmit = handleSubmit((data) => {
    if (data.id)
      deliveryAddressUpdateAllMutation.mutate([
        data as typeof data & { id: string },
      ]);
    else
      deliveryAddressCreateMutation.mutate(data, {
        onSettled: () => void deliveryAddressGetAllQuery.refetch(),
      });
  });

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit(e);
        }}
      >
        <div>
          <label htmlFor="street">Street</label>
          <input
            id="street"
            type="text"
            placeholder="Street"
            className={clsx("input-bordered input w-full max-w-xs", {
              "input-error": errors.street,
            })}
            {...register("street")}
          />
        </div>
        <div>
          <label htmlFor="city">City</label>
          <input
            id="city"
            type="text"
            placeholder="City"
            className={clsx("input-bordered input w-full max-w-xs", {
              "input-error": errors.city,
            })}
            {...register("city")}
          />
        </div>
        <div>
          <label htmlFor="state">State</label>
          <input
            id="state"
            type="text"
            placeholder="State"
            className={clsx("input-bordered input w-full max-w-xs", {
              "input-error": errors.state,
            })}
            {...register("state")}
          />
        </div>
        <div>
          <label htmlFor="zip">Zip</label>
          <input
            id="zip"
            type="text"
            placeholder="Zip"
            className={clsx("input-bordered input w-full max-w-xs", {
              "input-error": errors.zip,
            })}
            {...register("zip")}
          />
        </div>
        <button
          className="btn-primary btn"
          type="submit"
          disabled={
            deliveryAddressCreateMutation.isLoading ||
            deliveryAddressUpdateAllMutation.isLoading ||
            deliveryAddressGetAllQuery.isLoading
          }
        >
          {deliveryAddressCreateMutation.isLoading ||
          deliveryAddressUpdateAllMutation.isLoading ? (
            <span className="loading loading-spinner" />
          ) : null}
          {deliveryAddressId ? "Update" : "Create"}
        </button>
      </form>
    </div>
  );
}
